module.exports = grammar({
    name: 'dezyne',

    extras: $ => [$.comment, /\s+/],

    word: $ => $._identifier,

    conflicts: $ => [
        [$.compound_name, $.port_name],
        [$.compound_name],
    ],

    rules: {
        root: $ => repeat($._root_statement),

        _root_statement: $ => choice(
            $.import,
            $.dollars,
            $._type,
            $.namespace,
            $.interface,
            $.component,
        ),

        import: $ => seq('import', field('file_name', $.file_name), ';'),

        file_name: $ => /[^\s][^;]*/,

        dollars: $ => seq('$', field('value', $.dollars_content), '$'),

        dollars_content: $ => /[^\$]*/,

        _type: $ => choice(
            $.enum,
            $.int,
            $.extern,
        ),

        enum: $ => seq('enum', field('name', $.scoped_name), field('fields', $.fields), ';'),

        fields: $ => seq('{', field('name', $.name), repeat(seq(',', field('name', $.name))), optional(','), '}'),

        int: $ => seq('subint', field('name', $.scoped_name), '{', $._range, '}', ';'),

        _range: $ => seq(field('from', $.number), '..', field('to', $.number)),

        extern: $ => seq('extern', field('name', $.scoped_name), '$', field('value', $.dollars_content), '$', ';'),

        namespace: $ => seq('namespace', field('name', $.compound_name), '{', repeat($._namespace_statement), '}'),

        _namespace_statement: $ => choice(
            $._type,
            $.namespace,
            $.interface,
            $.component,
        ),

        interface: $ => seq('interface', field('name', $.scoped_name), field('body', $.interface_body)),

        interface_body: $ => seq('{', repeat($._interface_statement), optional(field('behavior', $.behavior)), '}'),

        _interface_statement: $ => choice(
            $._type,
            $.event,
        ),

        event: $ => seq(
            field('direction', $.direction), 
            field('type_name', $.type_name), 
            field('event_name', $.event_name), 
            field('formals', $.formals), 
            ';'
        ),

        direction: $ => choice('in', 'out'),

        component: $ => seq(
            'component', 
            field('name', $.scoped_name), 
            '{', repeat(field('port', $.port)), optional(field('body', $.body)), '}'
        ),

        body: $ => choice($.behavior, $.system),

        system: $ => seq('system', field('body', $.system_body)),

        system_body: $ => seq('{', repeat($._instance_or_binding), '}'),

        _instance_or_binding: $ => choice($.instance, $.binding),

        instance: $ => seq(field('type', $.compound_name), field('name', $.name), ';'),

        binding: $ => seq(field('left', $.end_point), '<=>', field('right', $.end_point), ';'),

        end_point: $ => choice(
            seq(field('name', $.compound_name), optional(seq('.', field('asterisk', $.asterisk)))),
            field('asterisk', $.asterisk)
        ),

        asterisk: _ => '*',

        port: $ => seq(
            field('direction', $.port_direction), 
            optional(field('qualifiers', $.port_qualifiers)), 
            field('type', $.compound_name), 
            optional(field('formals', $.formals)), 
            field('name', $.port_name), 
            ';'
        ),

        port_direction: $ => choice('provides', 'requires'),

        port_qualifiers: $ => repeat1(field('qualifier', $.port_qualifier)),

        port_qualifier: _ => choice('blocking', 'external', 'injected'),

        formals: $ => seq('(', optional(seq(field('formal', $.formal), repeat(seq(',', field('formal', $.formal))))), ')'),

        formal: $ => seq(
            optional(field('direction', $.formal_direction)), 
            field('type', $.type_name), 
            field('name', $.var_name)
        ),

        formal_direction: _ => choice('in', 'out', 'inout'),

        type_name: $ => choice($.compound_name, 'bool', 'void'),

        behavior: $ => seq(choice('behavior', 'behaviour') , optional(field('name', $.name)), field('body', $.behavior_body)),

        behavior_body: $ => seq('{', repeat($._behavior_statement), '}'),

        _behavior_statement: $ => choice(
            $.function,
            $.variable,
            $._declarative_statement,
            $._type,
        ),

        function: $ => seq(
            field('return_type', $.type_name), 
            field('name', $.name), 
            field('formals', $.formals), 
            field('body', $.compound)
        ),

        _declarative_statement: $ => choice(
            $.on,
            $.blocking,
            $.guard,
            prec(10, $.compound),
        ),

        on: $ => seq('on', field('triggers', $.triggers), ':', field('body', $._statement)),

        triggers: $ => seq(field('trigger', $.trigger), repeat(seq(',', field('trigger', $.trigger)))),

        trigger: $ => choice(
            $.port_event,
            $.optional,
            $.inevitable,
            $.event_name, // interface event
        ),

        port_event: $ => seq(
            field('port', $.port_name), 
            '.', 
            field('name', $.name), 
            field('formals', $.trigger_formals)
        ),

        optional: $ => 'optional',

        inevitable: $ => 'inevitable',

        trigger_formals: $ => seq('(', optional(seq($.trigger_formal, repeat(seq(',', $.trigger_formal)))), ')'),

        trigger_formal: $ => seq($.var, optional(seq('<-', $.var))),

        guard: $ => seq('[', $._otherwise_or_expression, ']', field('body', $._statement)),

        _otherwise_or_expression: $ => choice(
            field('condition', $.otherwise), 
            field('condition', $._expression)
        ),

        otherwise: $ => 'otherwise',

        compound : $ => seq('{', repeat(field('statement', $._statement)), '}'),

        variable: $ => seq(
            field('type_name', $.type_name), 
            field('name', $.var_name), 
            optional(seq('=', field('expression', $._expression))), 
            ';'
        ),

        event_name: $ => $._identifier,

        var_name: $ => $._identifier,

        _statement: $ => choice(
            $._declarative_statement,
            $._imperative_statement,
        ),

        _imperative_statement: $ => choice(
            $.variable,
            $.assign,
            $.if_statement,
            $.illegal,
            $.return,
            $.skip_statement,
            $.compound,
            $.reply,
            $.defer,
            $._action_or_call,
            seq($.interface_action, ';'),
        ),

        defer: $ => seq('defer', optional(field('arguments', $.arguments)), field('statement', $._imperative_statement)),

        interface_action: $ => $._identifier,

        _action_or_call: $ => seq(choice($.action, $.call), ';'),

        action: $ => seq(field('port_name', $.port_name), '.', field('name', $.name), field('arguments', $.arguments)),

        call: $ => seq(field('name', $.name), field('arguments', $.arguments)),

        arguments: $ => seq(
            '(',
            optional(seq(
                field('expression', $._expression), 
                repeat(seq(',', field('expression', $._expression)))
            )), 
            ')'
        ),

        skip_statement: $ => ';',

        blocking: $ => seq('blocking', field('statement', $._statement)),

        illegal: $ => seq('illegal', ';'),

        assign: $ => seq(field('left', $.var), '=', field('right', $._expression), ';'),

        if_statement: $ => prec.left(seq(
            'if', 
            '(', field('expression', $._expression), ')', 
            field('statement', $._imperative_statement), 
            optional(seq('else', field('else_statement', $._imperative_statement))))
        ),

        reply: $ => seq(optional(seq(field('port', $.port_name), '.')), 'reply', '(', field('expression', $._expression), ')', ';'),

        return: $ => seq('return', optional(field('expression', $._expression)), ';'),

        _expression: $ => choice(
            $.unary_expression,
            $.group,
            $.dollars,
            $.literal,
            $.compound_name,
            $.call,
            $.action,
            // $.interface_action (covered by $.compound_name)
            $.binary_expression,
        ),

        group: $ => seq('(', field('expression', $._expression), ')'),

        literal: $ => choice($.number, 'true', 'false'),

        unary_expression: $ => prec(2, choice(
            seq(field('operator', '!'), field('expression', $._expression)),
            seq(field('operator', '-'), field('expression', $._expression)),
        )),

        binary_expression: $ => choice(
            prec.left(seq(field('left', $._expression), field('operator', '||'), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '&&'), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '<'), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '<='), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '=='), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '!='), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '>='), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '>'), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '+'), field('right', $._expression))),
            prec.left(seq(field('left', $._expression), field('operator', '-'), field('right', $._expression))),
        ),

        compound_name: $ => seq(
            optional(field('global', $.global)),
            seq(
                field('part', alias($._identifier, $.identifier)), 
                repeat(field('part', seq('.', alias($._identifier, $.identifier))))
            )
        ),

        global: $ => '.',

        name: $ => $._identifier,

        var: $ => $._identifier,

        port_name: $ => $._identifier,

        scoped_name: $ => $._identifier,

        _identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        number: $ => /-?[0-9]+/,

        comment: $ => choice(
            seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
            seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
        ),
    }
});
