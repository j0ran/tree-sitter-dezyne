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

        interface: $ => seq('interface', $.scoped_name, '{', repeat($.interface_statement), optional($.behavior), '}'),

        interface_statement: $ => choice(
            $._type,
            $.event,
        ),

        event: $ => seq($.direction, $.type_name, $.event_name, $.formals, ';'),

        direction: $ => choice('in', 'out'),

        component: $ => seq('component', $.scoped_name, '{', repeat($.port), $.body, '}'),

        body: $ => choice($.behavior, $.system),

        system: $ => seq('system', '{', repeat($.instance_or_binding), '}'),

        instance_or_binding: $ => choice($.instance, $.binding),

        instance: $ => seq($.compound_name, $.name, ';'),

        binding: $ => seq($.end_point, '<=>', $.end_point, ';'),

        end_point: $ => choice(
            seq($.compound_name, optional(seq('.', '*'))),
            '*'
        ),

        port: $ => seq($.port_direction, optional($.port_qualifiers), $.compound_name, optional($.formals), $.port_name, ';'),

        port_direction: $ => choice('provides', 'requires'),

        port_qualifiers: $ => choice('blocking', 'external', 'injected'),

        formals: $ => seq('(', optional(seq($.formal, repeat(seq(',', $.formal)))), ')'),

        formal: $ => seq(optional(choice('in', 'out', 'inout')), $.type_name, $.var_name),

        type_name: $ => choice($.compound_name, 'bool', 'void'),

        behavior: $ => seq(choice('behavior', 'behaviour') , optional($.name), '{', repeat($.behavior_statement), '}'),

        behavior_statement: $ => choice(
            $.function,
            $.variable,
            $.declarative_statement,
            $._type,
        ),

        function: $ => seq($.type_name, $.name, $.formals, $.compound),

        declarative_statement: $ => choice(
            $.on,
            $.blocking,
            $.guard,
            prec(10, $.compound),
        ),

        on: $ => seq('on', $.triggers, ':', $.statement),

        triggers: $ => seq($.trigger, repeat(seq(',', $.trigger))),

        trigger: $ => choice(
            $.port_event,
            $.optional,
            $.inevitable,
            $.event_name,
        ),

        port_event: $ => seq($.port_name, '.', $.name, $.trigger_formals),

        optional: $ => 'optional',

        inevitable: $ => 'inevitable',

        trigger_formals: $ => seq('(', optional(seq($.trigger_formal, repeat(seq(',', $.trigger_formal)))), ')'),

        trigger_formal: $ => seq($.var, optional(seq('<-', $.var))),

        guard: $ => seq('[', choice($.otherwise, $.expression), ']', $.statement),

        otherwise: $ => 'otherwise',

        compound : $ => seq('{', repeat($.statement), '}'),

        variable: $ => seq($.type_name, $.var_name, optional(seq('=', $.expression)), ';'),

        event_name: $ => $._identifier,

        var_name: $ => $._identifier,

        statement: $ => choice(
            $.declarative_statement,
            $.imperative_statement,
        ),

        imperative_statement: $ => choice(
            $.variable,
            $.assign,
            $.if_statement,
            $.illegal,
            $.return,
            $.skip_statement,
            $.compound,
            $.reply,
            $.defer,
            $.action_or_call,
            seq($.interface_action, ';'),
        ),

        defer: $ => seq('defer', optional($.arguments), $.imperative_statement),

        interface_action: $ => $._identifier,

        action_or_call: $ => seq(choice($.action, $.call), ';'),

        action: $ => seq($.port_name, '.', $.name, $.arguments),

        call: $ => seq($.name, $.arguments),

        arguments: $ => seq('(', optional(seq($.expression, repeat(seq(',', $.expression)))), ')'),

        skip_statement: $ => ';',

        blocking: $ => seq('blocking', $.statement),

        illegal: $ => seq('illegal', ';'),

        assign: $ => seq($.var, '=', $.expression, ';'),

        if_statement: $ => prec.left(seq('if', '(', $.expression, ')', $.imperative_statement, optional(seq('else', $.imperative_statement)))),

        reply: $ => seq(optional(seq($.port_name, '.')), 'reply', '(', $.expression, ')', ';'),

        return: $ => seq('return', optional($.expression), ';'),

        expression: $ => choice(
            $.unary_expression,
            $.group,
            $.dollars,
            $.literal,
            $.compound_name,
            $.call,
            $.action,
            // $.interface_action,
            $.binary_expression,
        ),

        group: $ => seq('(', $.expression, ')'),

        literal: $ => choice($.number, 'true', 'false'),

        unary_expression: $ => prec(2, choice(
            seq('!', $.expression),
            seq('-', $.expression),
        )),

        binary_expression: $ => choice(
            prec.left(seq($.expression, '||', $.expression)),
            prec.left(seq($.expression, '&&', $.expression)),
            prec.left(seq($.expression, '<', $.expression)),
            prec.left(seq($.expression, '<=', $.expression)),
            prec.left(seq($.expression, '==', $.expression)),
            prec.left(seq($.expression, '!=', $.expression)),
            prec.left(seq($.expression, '>=', $.expression)),
            prec.left(seq($.expression, '>', $.expression)),
            prec.left(seq($.expression, '+', $.expression)),
            prec.left(seq($.expression, '-', $.expression)),
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

// What is the purpose of illegal-triggers (line 233)
// What is the interface action in an expression? (line 306)
// TODO: Expression interface_action
