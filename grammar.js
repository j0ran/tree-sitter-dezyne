module.exports = grammar({
    name: 'dezyne',

    extras: $ => [$.comment, /\s+/],

    word: $ => $._identifier,

    conflicts: $ => [
        [$.compound_name],
    ],

    rules: {
        root: $ => repeat(field("statement", $._root_statement)),

        _root_statement: $ => choice(
            $.import,
            $.dollars,
            $._type,
            $.namespace,
            $.interface,
            $.component,
            $.function
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

        fields: $ => seq('{', field('name', $.member_name), repeat(seq(',', field('name', $.member_name))), optional(','), '}'),

        int: $ => seq('subint', field('name', $.scoped_name), '{', $._range, '}', ';'),

        _range: $ => seq(field('from', $.number), '..', field('to', $.number)),

        extern: $ => seq('extern', field('name', $.scoped_name), '$', field('value', $.dollars_content), '$', ';'),

        namespace: $ => seq('namespace', field('name', $.compound_name), '{', repeat(field("body_statement", $._namespace_statement)), '}'),

        _namespace_statement: $ => choice(
            $._type,
            $.namespace,
            $.interface,
            $.component,
            $.function
        ),

        interface: $ => seq('interface', field('name', $.scoped_name), field('body', $.interface_body)),

        interface_body: $ => seq('{', repeat(field('interface_statement', $._interface_statement)), optional(field('behavior', $.behavior)), '}'),

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
            '{', repeat(field('port', $.port)), optional(field('body', $._body)), '}'
        ),

        _body: $ => choice($.behavior, $.system),

        system: $ => seq('system', field('body', $.system_body)),

        system_body: $ => seq('{', repeat(field('instance_or_binding', $._instance_or_binding)), '}'),

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
            field('name', $.name), 
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

        formal_direction: _ => choice('in', 'out', 'inout', 'provides', 'requires'),

        type_name: $ => choice(field('name', $.compound_name), 'bool', 'void'),

        behavior: $ => seq(choice('behavior', 'behaviour') , optional(field('name', $.name)), field('body', $.behavior_body)),

        behavior_body: $ => seq('{', repeat(field('statement', $._behavior_statement)), '}'),

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
            field('body', choice(field('compound', $.compound), field('expression', $.function_body_one_line)))
        ),

        function_body_one_line: $ => seq(
            '=',
            field('expression', $._expression),
            ';'
        ),

        _declarative_statement: $ => choice(
            $.on,
            $.blocking,
            $.guard,
            $.invariant,
            prec(10, $.compound),
        ),

        invariant: $ => seq(
            'invariant',
            field('expression', $._expression),
            ';'
        ),

        on: $ => seq('on', field('triggers', $.triggers), ':', field('body', $._statement)),

        triggers: $ => seq(field('trigger', $.trigger), repeat(seq(',', field('trigger', $.trigger)))),

        trigger: $ => seq(
            choice(
                field('optional', $.optional),
                field('inevitable', $.inevitable),
                field('name', $.compound_name),
            ),
            optional(field('formals', $.trigger_formals))
        ),

        optional: $ => 'optional',

        inevitable: $ => 'inevitable',

        trigger_formals: $ => seq('(', optional(seq(field('trigger_formal', $.trigger_formal), repeat(seq(',', field('trigger_formal', $.trigger_formal))))), ')'),

        trigger_formal: $ => seq(field('name', $.name), optional(seq('<-', field('assign_name', $.name)))),

        guard: $ => seq(
            field('condition', $.guard_condition), 
            field('body', $._statement)
        ),
        guard_condition: $ => seq(
            '[', field('expression', $._otherwise_or_expression), ']'
        ),

        _otherwise_or_expression: $ => choice(
            $.otherwise, 
            $._expression
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
            $.call_statement,
            $.variable,
            $.assign,
            $.if_statement,
            $.illegal,
            $.interface_action_statement,
            $.return,
            $.skip_statement,
            $.compound,
            $.reply,
            $.defer,
        ),

        defer: $ => seq('defer', optional(field('arguments', $.arguments)), field('statement', $._imperative_statement)),

        interface_action_statement: $ => seq(field('name', $.interface_action), ';'),

        interface_action: $ => $._identifier,

        call_statement: $ => seq(field('call', $.call), ';'),

        call: $ => seq(field('name', $.compound_name), field('arguments', $.arguments)),

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

        assign: $ => seq(field('left', $.name), '=', field('right', $._expression), ';'),

        if_statement: $ => prec.left(seq(
            "if", 
            '(', field('expression', $._expression), ')', 
            field('statement', $._imperative_statement), 
            optional(seq('else', field('else_statement', $._imperative_statement)))
        )),

        reply: $ => seq(optional(seq(field('port', $.name), '.')), 'reply', '(', optional(field('expression', $._expression)), ')', ';'),

        return: $ => seq('return', optional(field('expression', $._expression)), ';'),

        _expression: $ => choice(
            $.unary_expression,
            $.group,
            $.dollars,
            $.literal,
            $.compound_name,
            $.call,
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
            prec.left(seq(field('left', $._expression), field('operator', '=>'), field('right', $._expression))),
        ),

        compound_name: $ => seq(
            optional(field('global', '.')),
            seq(
                field('part', alias($.name, $.identifier)), 
                repeat(seq('.', field('part', alias($.member_name, $.identifier))))
            )
        ),

        name: $ => $._identifier,
        member_name: $ => /[a-zA-Z0-9_]+/,

        scoped_name: $ => $._identifier,

        _identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        number: $ => /-?[0-9]+/,

        comment: $ => choice(
            seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
            seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
        ),
    }
});
