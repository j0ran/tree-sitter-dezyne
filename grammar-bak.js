module.exports = grammar({
    name: 'dezyne',

    extras: $ => [$.comment, /\s+/],

    word: $ => $.identifier,

    rules: {
        source_file: $ => repeat(choice(
            $.import,
            $.dollars,
            $.type,
            $.namespace,
            $.interface,
            // $.component,
        )),

        import: $ => seq('import', $.file_name, ';'),

        file_name: $ => /[^\s;]+/,

        dollars: $ => /\$[^\$]*\$/,

        type: $ => choice(
            $.enum,
            $.int,
            $.extern,
        ),

        enum: $ => seq('enum', $.scoped_name, '{', $.fields, '}', ';'),

        fields: $ => seq($.scoped_name, repeat(seq(',', $.scoped_name)), optional(',')),

        int: $ => seq('subint', $.scoped_name, '{', $.range, '}', ';'),

        range: $ => seq($.from, '..', $.to),

        from: $ => $.number,

        to: $ => $.number,

        extern: $ => seq('extern', $.scoped_name, $.dollars, ';'),

        namespace: $ => seq('namespace', $.compound_name, '{', repeat($.namespace_root), '}'),

        namespace_root: $ => choice(
            $.type,
            $.namespace,
            $.interface,
            // $.component,
        ),

        interface: $ => seq('interface', $.scoped_name, '{', repeat($.types_and_events), optional($.behavior), '}'),

        types_and_events: $ => choice(
            $.type,
            $.event,
        ),

        event: $ => seq($.direction, $.type_name, $.event_name, $.formals, ';'),

        direction: $ => choice('in', 'out'),

        formals: $ => seq('(', optional(seq($.formal, repeat(seq(',', $.formal)))), ')'),

        formal: $ => seq(optional(choice('in', 'out', 'inout')), $.type_name, $.add_var),

        behavior: $ => seq(choice('behavior', 'behaviour'), optional($.name), '{', repeat($.behavior_statement), '}'),

        behavior_statement: $ => choice(
            $.function,
            $.variable,
            // $.declarative_statement,
        ),

        function: $ => seq($.type_name, $.name, $.formals, '{', repeat($.statement), '}'),

        variable: $ => seq($.type_name, $.add_var, optional(seq('=', $.expression)), ';'),

        expression: $ => choice(
            $.compound_name,
            $.literal,
            $.unary_expression,
            $.binary_expression,
        ),

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

        statement: $ => $.imperative_statement,
        //     choice(
        //     // $.declarative_statement,
        //     $.imperative_statement,
        // ),

        imperative_statement: $ => choice(
            $.if_statement,
            $.variable,
            $.assign,
            $.illegal,
            $.return,
            $.skip_statement,
            $.compound,
            $.reply,
            $.defer,
            // $.action_or_call,
            // $.interface_action,
        ),

        assign: $ => seq($.identifier, '=', $.expression, ';'),

        if_statement: $ => prec.left(seq('if', '(', $.expression,  ')', $.imperative_statement, optional(seq('else', $.imperative_statement)))),

        literal: $ => choice($.number, 'false', 'true'),

        illegal: $ => seq('illegal', ';'),

        return: $ => seq('return', optional($.expression), ';'),

        skip_statement: $ => ';',

        compound: $ => seq('{', $.statement, '}'),

        // Does not work: api.reply();
        reply: $ => seq(optional(seq($.name, '.')), 'reply', '(', optional($.expression), ')', ';'),

        defer: $ => seq('defer', ';'),

        action_or_call: $ => seq(choice($.action, $.call), ';'),

        action: $ => seq($.port, '.', $.name, $.arguments),

        port: $ => $.identifier,

        arguments: $ => seq('(', optional(seq($.argument, repeat(seq(',', $.argument)))), ')'),

        argument: $ => $.expression,

        call: $ => seq($.name, $.arguments),

        interface_action: $ => $.name,

        scoped_name: $ => $.identifier,

        compound_name: $ => seq(
            optional($.global),
            repeat(seq($.identifier, token.immediate('.'))),
            $.identifier
        ),

        event_name: $ => $.identifier,

        add_var: $ => $.identifier,

        type_name: $ => choice($.compound_name, $.bool, $.void),

        bool: $ => 'bool',

        void: $ => 'void',

        global: $ => '.',

        scope: $ => prec.left(seq($.name, repeat(seq('.', $.name)), '.')),

        name: $ => $.identifier,

        identifier: $ => /[a-zA-Z][a-zA-Z]*/,

        number: $ => /-?[0-9]+/,

        comment: $ => choice(
            seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
            seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
        ),
    }
});
