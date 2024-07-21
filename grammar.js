module.exports = grammar({
    name: 'dezyne',

    word: $ => $.identifier,

    rules: {
        source_file: $ => repeat($._statement),

        expression: $ => choice(
            $.reference,
            $.literal,
            $.unary_expression,
            $.binary_expression,
        ),

        reference: $ => $._global_scoped_identifier,

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

        _statement: $ => choice(
            $._imperative_statement,
            $._declarative_statement,
        ),

        _imperative_statement: $ => choice(
            $.variable_declaration,
            $.reply_statement,
            $.assign_statement,
            $.if_statement,
            $.empty_statement,
            $.block_statement,
            $.function_call_statement,
            $.out_event_statement,
            $.illegal_statement,
            $.defer_statement,
        ),

        _declarative_statement: $ => choice(
            $.on_statement,
            // $.guard_statement,
            // $.block_statement,
        ),

        reply_statement: $ => seq(
            optional(seq(field('port', $.identifier), '.')),
            'reply',
            '(', optional($.expression), ')',
            ';'
        ),

        variable_declaration: $ => seq(
            field('type', $.type_name),
            field('var', $.identifier),
            ';'
        ),

        assign_statement: $ => seq(
            field('var', $.identifier),
            '=',
            field('expression', $.expression),
            ';'
        ),

        if_statement: $ => prec.left(seq(
            'if', '(', field('expression', $.expression), ')', field('true', $._imperative_statement),
            optional(seq('else', field('false', $._imperative_statement)))),
        ),

        empty_statement: $ => ';',

        block_statement: $ => seq('{', repeat($._statement), '}'),

        function_call_statement: $ => seq(field('function', $.identifier), '(', ')', ';'),

        out_event_statement: $ => seq(field('port', $.identifier), '.', field('event', $.identifier), '(', ')', ';'),

        illegal_statement: $ => seq('illegal', ';'),

        defer_statement: $ => seq(
            'defer',
            optional(seq('(', optional($.expression), ')')),
            $._imperative_statement
        ),

        on_statement: $ => seq(
            'on',
            field('port', $.identifier), '.', field('event', $.event),
            '(',
                optional(seq($._trigger_formal, repeat(seq(',', $._trigger_formal)))),
            ')',
            ':',
            $._statement,
        ),

        _trigger_formal: $ => seq(
            field('var', $.identifier),
            optional(seq('<-', field('ref', $.identifier)))
        ),

        event: $ => choice(
            'optional',
            'inevitable',
            $.identifier,
        ),

        type_name: $ => $._global_scoped_identifier,

        _scoped_identifier: $ => seq($.identifier, repeat(seq('.', $.identifier))),

        _global_scoped_identifier: $ => seq(optional($.global), $._scoped_identifier),

        global: $ => '.',

        literal: $ => choice($.number, 'true', 'false'),

        identifier: $ => /[a-zA-Z][a-zA-Z0-9]*/,

        number: $ => /-?[0-9]+/,
    }
})
