module.exports = grammar({
    name: 'dezyne',

    extras: $ => [$.comment, /\s+/],

    word: $ => $.identifier,

    conflicts: $ => [
        [$.compound_name, $.port_name],
        [$.compound_name],
    ],

    rules: {
        root: $ => repeat($.root_statement),

        root_statement: $ => choice(
            $.import,
            $.dollars,
            $.type,
            $.namespace,
            $.interface,
            $.component,
        ),

        import: $ => seq('import', $.file_name, ';'),

        file_name: $ => /[^\s][^;]*/,

        dollars: $ => seq('$', $.dollars_content, '$'),

        dollars_content: $ => /[^\$]*/,

        type: $ => choice(
            $.enum,
            $.int,
            $.extern,
        ),

        enum: $ => seq('enum', $.scoped_name, '{', $.fields, '}', ';'),

        fields: $ => seq($.name, repeat(seq(',', $.name)), optional(',')),

        int: $ => seq('subint', $.scoped_name, '{', $.range, '}', ';'),

        range: $ => seq($.number, '..', $.number),

        extern: $ => seq('extern', $.scoped_name, $.dollars, ';'),

        namespace: $ => seq('namespace', $.compound_name, '{', repeat($.namespace_statement), '}'),

        namespace_statement: $ => choice(
            $.type,
            $.namespace,
            $.interface,
            $.component,
        ),

        interface: $ => seq('interface', $.scoped_name, '{', repeat($.interface_statement), $.behavior, '}'),

        interface_statement: $ => choice(
            $.type,
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
            $.type,
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

        event_name: $ => $.identifier,

        var_name: $ => $.identifier,

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

        interface_action: $ => $.identifier,

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
            optional($.global),
            seq($.identifier, repeat(seq('.', $.identifier)))
        ),

        global: $ => '.',

        name: $ => $.identifier,

        var: $ => $.identifier,

        port_name: $ => $.identifier,

        scoped_name: $ => $.identifier,

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

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
