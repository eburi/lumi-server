/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */
define('ace/mode/xquery', ['require', 'exports', 'module' , 'ace/worker/worker_client', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/xquery/XQueryLexer', 'ace/range', 'ace/mode/behaviour/xquery', 'ace/mode/folding/cstyle'], function(require, exports, module) {


var WorkerClient = require("../worker/worker_client").WorkerClient;
var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var XQueryLexer = require("./xquery/XQueryLexer").XQueryLexer;
var Range = require("../range").Range;
var XQueryBehaviour = require("./behaviour/xquery").XQueryBehaviour;
var CStyleFoldMode = require("./folding/cstyle").FoldMode;


var Mode = function(parent) {
    this.$tokenizer   = new XQueryLexer();
    this.$behaviour   = new XQueryBehaviour();
    this.foldingRules = new CStyleFoldMode();
};

oop.inherits(Mode, TextMode);

(function() {

    this.getNextLineIndent = function(state, line, tab) {
      var indent = this.$getIndent(line);
      var match = line.match(/\s*(?:then|else|return|[{\(]|<\w+>)\s*$/);
      if (match)
        indent += tab;
        return indent;
    };
    
    this.checkOutdent = function(state, line, input) {
      if (! /^\s+$/.test(line))
            return false;

        return /^\s*[\}\)]/.test(input);
    };
    
    this.autoOutdent = function(state, doc, row) {
      var line = doc.getLine(row);
        var match = line.match(/^(\s*[\}\)])/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);
    };

    this.$getIndent = function(line) {
        var match = line.match(/^(\s+)/);
        if (match) {
            return match[1];
        }

        return "";
    };
    
    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        var i, line;
        var outdent = true;
        var re = /^\s*\(:(.*):\)/;

        for (i=startRow; i<= endRow; i++) {
            if (!re.test(doc.getLine(i))) {
                outdent = false;
                break;
            }
        }

        var range = new Range(0, 0, 0, 0);
        for (i=startRow; i<= endRow; i++) {
            line = doc.getLine(i);
            range.start.row  = i;
            range.end.row    = i;
            range.end.column = line.length;

            doc.replace(range, outdent ? line.match(re)[1] : "(:" + line + ":)");
        }
    };
    
    this.createWorker = function(session) {
        this.$deltas = [];
        var worker = new WorkerClient(["ace"], "ace/mode/xquery_worker", "XQueryWorker");
        var that = this;

        session.getDocument().on('change', function(evt){
          that.$deltas.push(evt.data);
        });

        worker.attachToDocument(session.getDocument());
        
        worker.on("start", function(e) {
          that.$deltas = [];
        });

        worker.on("error", function(e) {
          session.setAnnotations([e.data]);
        });
        
        worker.on("ok", function(e) {
          session.clearAnnotations();
        });
        
        worker.on("highlight", function(tokens) {
          if(that.$deltas.length > 0) return;
          that.$tokenizer.tokens = tokens.data.tokens;
          that.$tokenizer.lines  = session.getDocument().getAllLines();
          session.bgTokenizer.lines = [];
          session.bgTokenizer.states = [];
          
          var rows = Object.keys(that.$tokenizer.tokens);
          for(var i=0; i < rows.length; i++) {
            var row = parseInt(rows[i]);
            session.bgTokenizer.fireUpdateEvent(row, row);
          }
        });
        
        return worker;
    };
    
}).call(Mode.prototype);

exports.Mode = Mode;
});
 
define('ace/mode/xquery/XQueryLexer', ['require', 'exports', 'module' , 'ace/mode/xquery/XQueryTokenizer'], function(require, exports, module) {
  
  var XQueryTokenizer = require("./XQueryTokenizer").XQueryTokenizer;
  
  var TokenHandler = function(code) {
      
    var input = code;
    
    this.tokens = [];
 
    this.reset = function(code) {
      input = input;
      this.tokens = [];
    };
    
    this.startNonterminal = function(name, begin) {};

    this.endNonterminal = function(name, end) {};

    this.terminal = function(name, begin, end) {
      this.tokens.push({
        name: name,
        value: input.substring(begin, end)
      });
    };

    this.whitespace = function(begin, end) {
      this.tokens.push({
        name: "WS",
        value: input.substring(begin, end)
      });
    };
  };

    var keys = "after|ancestor|ancestor-or-self|and|as|ascending|attribute|before|case|cast|castable|child|collation|comment|copy|count|declare|default|delete|descendant|descendant-or-self|descending|div|document|document-node|element|else|empty|empty-sequence|end|eq|every|except|first|following|following-sibling|for|function|ge|group|gt|idiv|if|import|insert|instance|intersect|into|is|item|last|le|let|lt|mod|modify|module|namespace|namespace-node|ne|node|only|or|order|ordered|parent|preceding|preceding-sibling|processing-instruction|rename|replace|return|satisfies|schema-attribute|schema-element|self|some|stable|start|switch|text|to|treat|try|typeswitch|union|unordered|validate|where|with|xquery|contains|paragraphs|sentences|times|words|by|collectionreturn|variable|version|option|when|encoding|toswitch|catch|tumbling|sliding|window|at|using|stemming|collection|schema|while|on|nodes|index|external|then|in|updating|value|of|containsbreak|loop|continue|exit|returning|append|json|position".split("|");
    var keywords = keys.map(
      function(val) { return { name: "'" + val + "'", token: "keyword" }; }
    );
    
    var ncnames = keys.map(
      function(val) { return { name: "'" + val + "'", token: "text", next: function(stack){ stack.pop(); } }; }
    );

    var cdata = "constant.language";
    var number = "constant";
    var xmlcomment = "comment";
    var pi = "xml-pe";
    var pragma = "constant.buildin";
    
    var Rules = {
      start: [
        { name: "'(#'", token: pragma, next: function(stack){ stack.push("Pragma"); } },
        { name: "'(:'", token: "comment", next: function(stack){ stack.push("Comment"); } },
        { name: "'(:~'", token: "comment.doc", next: function(stack){ stack.push("CommentDoc"); } },
        { name: "'<!--'", token: xmlcomment, next: function(stack){ stack.push("XMLComment"); } },
        { name: "'<?'", token: pi, next: function(stack) { stack.push("PI"); } },
        { name: "''''", token: "string", next: function(stack){ stack.push("AposString"); } },
        { name: "'\"'", token: "string", next: function(stack){ stack.push("QuotString"); } },
        { name: "Annotation", token: "support.function" },
        { name: "ModuleDecl", token: "keyword", next: function(stack){ stack.push("Prefix"); } },
        { name: "OptionDecl", token: "keyword", next: function(stack){ stack.push("_EQName"); } },
        { name: "AttrTest", token: "support.type" },
        { name: "Variable",  token: "variable" },
        { name: "'<![CDATA['", token: cdata, next: function(stack){ stack.push("CData"); } },
        { name: "IntegerLiteral", token: number },
        { name: "DecimalLiteral", token: number },
        { name: "DoubleLiteral", token: number },
        { name: "Operator", token: "keyword.operator" },
        { name: "EQName", token: function(val) { return keys.indexOf(val) !== -1 ? "keyword" : "support.function"; } },
        { name: "'('", token:"lparen" },
        { name: "')'", token:"rparen" },
        { name: "Tag", token: "meta.tag", next: function(stack){ stack.push("StartTag"); } },
        { name: "'}'", token: "text", next: function(stack){ if(stack.length > 1) { stack.pop(); } } },
        { name: "'{'", token: "text" } //, next: function(stack){ if(stack.length > 1) { stack.pop(); } } }
      ].concat(keywords),
      _EQName: [
        { name: "EQName", token: "text", next: function(stack) { stack.pop(); } }
      ].concat(ncnames),
      Prefix: [
        { name: "NCName", token: "text", next: function(stack) { stack.pop(); } }
      ].concat(ncnames),
      StartTag: [
        { name: "'>'", token: "meta.tag", next: function(stack){ stack.push("TagContent"); } },
        { name: "QName", token: "entity.other.attribute-name" },
        { name: "'='", token: "text" },
        { name: "''''", token: "string", next: function(stack){ stack.push("AposAttr"); } },
        { name: "'\"'", token: "string", next: function(stack){ stack.push("QuotAttr"); } },
        { name: "'/>'", token: "meta.tag.r", next: function(stack){ stack.pop(); } }
      ],
      TagContent: [
        { name: "ElementContentChar", token: "text" },
        { name: "'<![CDATA['", token: cdata, next: function(stack){ stack.push("CData"); } },
        { name: "'<!--'", token: xmlcomment, next: function(stack){ stack.push("XMLComment"); } },
        { name: "Tag", token: "meta.tag", next: function(stack){ stack.push("StartTag"); } },
        { name: "PredefinedEntityRef", token: "constant.language.escape" },
        { name: "CharRef", token: "constant.language.escape" },
        { name: "'{{'", token: "text" },
        { name: "'}}'", token: "text" },
        { name: "'{'", token: "text", next: function(stack){ stack.push("start"); } },
        { name: "EndTag", token: "meta.tag", next: function(stack){ stack.pop(); stack.pop(); } }
      ],
      AposAttr: [
        { name: "''''", token: "string", next: function(stack){ stack.pop(); } },
        { name: "EscapeApos", token: "constant.language.escape" },
        { name: "AposAttrContentChar", token: "string" },
        { name: "PredefinedEntityRef", token: "constant.language.escape" },
        { name: "CharRef", token: "constant.language.escape" },
        { name: "'{{'", token: "string" },
        { name: "'}}'", token: "string" },
        { name: "'{'", token: "text", next: function(stack){ stack.push("start"); } }
      ],
      QuotAttr: [
        { name: "'\"'", token: "string", next: function(stack){ stack.pop(); } },
        { name: "EscapeQuot", token: "constant.language.escape" },
        { name: "QuotAttrContentChar", token: "string" },
        { name: "PredefinedEntityRef", token: "constant.language.escape" },
        { name: "CharRef", token: "constant.language.escape" },
        { name: "'{{'", token: "string" },
        { name: "'}}'", token: "string" },
        { name: "'{'", token: "text", next: function(stack){ stack.push("start"); } }
      ],
      Pragma: [
        { name: "PragmaContents", token: pragma },
        { name: "'#)'", token: pragma, next: function(stack){ stack.pop(); } }
      ],
      Comment: [
        { name: "CommentContents", token: "comment" },
        { name: "'(:'", token: "comment", next: function(stack){ stack.push("Comment"); } },
        { name: "':)'", token: "comment", next: function(stack){ stack.pop(); } }
      ],
      CommentDoc: [
        { name: "DocCommentContents", token: "comment.doc" },
        { name: "DocTag", token: "comment.doc.tag" },
        { name: "'(:'", token: "comment.doc", next: function(stack){ stack.push("CommentDoc"); } },
        { name: "':)'", token: "comment.doc", next: function(stack){ stack.pop(); } }
      ],
      XMLComment: [
        { name: "DirCommentContents", token: xmlcomment },
        { name: "'-->'", token: xmlcomment, next: function(stack){ stack.pop(); } }
      ],
      CData: [
        { name: "CDataSectionContents", token: cdata },
        { name: "']]>'", token: cdata, next: function(stack){ stack.pop(); } }
      ],
      PI: [
        { name: "DirPIContents", token: pi },
        { name: "PITarget", token: pi },
        { name: "S", token: pi },
        { name: "'?>'", token: pi, next: function(stack){ stack.pop(); } }
      ],
      AposString: [
        { name: "''''", token: "string", next: function(stack){ stack.pop(); } },
        { name: "PredefinedEntityRef", token: "constant.language.escape" },
        { name: "CharRef", token: "constant.language.escape" },
        { name: "EscapeApos", token: "constant.language.escape" },
        { name: "AposChar", token: "string" }
      ],
      QuotString: [
        { name: "'\"'", token: "string", next: function(stack){ stack.pop(); } },
        { name: "PredefinedEntityRef", token: "constant.language.escape" },
        { name: "CharRef", token: "constant.language.escape" },
        { name: "EscapeQuot", token: "constant.language.escape" },
        { name: "QuotChar", token: "string" }
      ]
    };
    
exports.XQueryLexer = function() {
  
  this.tokens = [];
  
  this.getLineTokens = function(line, state, row) {
    state = (state === "start" || !state) ? '["start"]' : state;
    var stack = JSON.parse(state);
    var h = new TokenHandler(line);
    var tokenizer = new XQueryTokenizer(line, h);
    var tokens = [];
    
    while(true) {
      var currentState = stack[stack.length - 1];
      try {
        
        h.tokens = [];
        tokenizer["parse_" + currentState]();
        var info = null;
        
        if(h.tokens.length > 1 && h.tokens[0].name === "WS") {
          tokens.push({
            type: "text",
            value: h.tokens[0].value
          });
          h.tokens.splice(0, 1);
        }
        
        var token = h.tokens[0];
        var rules  = Rules[currentState];
        for(var k = 0; k < rules.length; k++) {
          var rule = Rules[currentState][k];
          if((typeof(rule.name) === "function" && rule.name(token)) || rule.name === token.name) {
            info = rule;
            break;
          }
        }
        
        if(token.name === "EOF") { break; }
        
        tokens.push({
          type: info === null ? "text" : (typeof(info.token) === "function" ? info.token(token.value) : info.token),
          value: token.value
        });
        
        if(info && info.next) {
          info.next(stack);    
        }  
      
      } catch(e) {
        if(e instanceof tokenizer.ParseException) {
          var index = 0;
          for(var i=0; i < tokens.length; i++) {
            index += tokens[i].value.length;
          }
          tokens.push({ type: "text", value: line.substring(index) });
          return {
            tokens: tokens,
            state: JSON.stringify(["start"])
          };
        } else {
          throw e;
        }  
      }
    }
   
    
    if(this.tokens[row] !== undefined) {
      var cachedLine = this.lines[row];
      var begin = sharedStart([line, cachedLine]);
      var diff = cachedLine.length - line.length;
      var idx = 0;
      var col = 0;
      for(var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        for(var j = 0; j < this.tokens[row].length; j++) {
          var semanticToken = this.tokens[row][j];
          if(
             ((col + token.value.length) <= begin.length && semanticToken.sc === col && semanticToken.ec === (col + token.value.length)) ||
             (semanticToken.sc === (col + diff) && semanticToken.ec === (col + token.value.length + diff))
            ) {
            idx = i;
            tokens[i].type = semanticToken.type;
          }
        }
        col += token.value.length;
      }
    }

    return {
      tokens: tokens,
      state: JSON.stringify(stack)
    };
  };
  
  function sharedStart(A) {
    var tem1, tem2, s, A = A.slice(0).sort();
    tem1 = A[0];
    s = tem1.length;
    tem2 = A.pop();
    while(s && tem2.indexOf(tem1) == -1) {
        tem1 = tem1.substring(0, --s);
    }
    return tem1;
  }
};
});

                                                            define('ace/mode/xquery/XQueryTokenizer', ['require', 'exports', 'module' ], function(require, exports, module) {
                                                            var XQueryTokenizer = exports.XQueryTokenizer = function XQueryTokenizer(string, parsingEventHandler)
                                                            {
                                                              init(string, parsingEventHandler);
  var self = this;

  this.ParseException = function(b, e, s, o, x)
  {
    var
      begin = b,
      end = e,
      state = s,
      offending = o,
      expected = x;

    this.getBegin = function() {return begin;};
    this.getEnd = function() {return end;};
    this.getState = function() {return state;};
    this.getExpected = function() {return expected;};
    this.getOffending = function() {return offending;};

    this.getMessage = function()
    {
      return offending < 0 ? "lexical analysis failed" : "syntax error";
    };
  };

  function init(string, parsingEventHandler)
  {
    eventHandler = parsingEventHandler;
    input = string;
    size = string.length;
    reset(0, 0, 0);
  }

  this.getInput = function()
  {
    return input;
  };

  function reset(l, b, e)
  {
                 b0 = b; e0 = b;
    l1 = l; b1 = b; e1 = e;
    end = e;
    eventHandler.reset(input);
  }

  this.getOffendingToken = function(e)
  {
    var o = e.getOffending();
    return o >= 0 ? XQueryTokenizer.TOKEN[o] : null;
  };

  this.getExpectedTokenSet = function(e)
  {
    var expected;
    if (e.getExpected() < 0)
    {
      expected = XQueryTokenizer.getTokenSet(- e.getState());
    }
    else
    {
      expected = [XQueryTokenizer.TOKEN[e.getExpected()]];
    }
    return expected;
  };

  this.getErrorMessage = function(e)
  {
    var tokenSet = this.getExpectedTokenSet(e);
    var found = this.getOffendingToken(e);
    var prefix = input.substring(0, e.getBegin());
    var lines = prefix.split("\n");
    var line = lines.length;
    var column = lines[line - 1].length + 1;
    var size = e.getEnd() - e.getBegin();
    return e.getMessage()
         + (found == null ? "" : ", found " + found)
         + "\nwhile expecting "
         + (tokenSet.length == 1 ? tokenSet[0] : ("[" + tokenSet.join(", ") + "]"))
         + "\n"
         + (size == 0 || found != null ? "" : "after successfully scanning " + size + " characters beginning ")
         + "at line " + line + ", column " + column + ":\n..."
         + input.substring(e.getBegin(), Math.min(input.length, e.getBegin() + 64))
         + "...";
  };

  this.parse_start = function()
  {
    eventHandler.startNonterminal("start", e0);
    lookahead1W(14);                // ModuleDecl | Annotation | OptionDecl | Operator | Variable | Tag | AttrTest |
    switch (l1)
    {
    case 54:                        // '<![CDATA['
      shift(54);                    // '<![CDATA['
      break;
    case 53:                        // '<!--'
      shift(53);                    // '<!--'
      break;
    case 55:                        // '<?'
      shift(55);                    // '<?'
      break;
    case 39:                        // '(#'
      shift(39);                    // '(#'
      break;
    case 41:                        // '(:~'
      shift(41);                    // '(:~'
      break;
    case 40:                        // '(:'
      shift(40);                    // '(:'
      break;
    case 35:                        // '"'
      shift(35);                    // '"'
      break;
    case 37:                        // "'"
      shift(37);                    // "'"
      break;
    case 272:                       // '}'
      shift(272);                   // '}'
      break;
    case 269:                       // '{'
      shift(269);                   // '{'
      break;
    case 38:                        // '('
      shift(38);                    // '('
      break;
    case 42:                        // ')'
      shift(42);                    // ')'
      break;
    case 48:                        // '/'
      shift(48);                    // '/'
      break;
    case 60:                        // '['
      shift(60);                    // '['
      break;
    case 61:                        // ']'
      shift(61);                    // ']'
      break;
    case 45:                        // ','
      shift(45);                    // ','
      break;
    case 47:                        // '.'
      shift(47);                    // '.'
      break;
    case 52:                        // ';'
      shift(52);                    // ';'
      break;
    case 50:                        // ':'
      shift(50);                    // ':'
      break;
    case 34:                        // '!'
      shift(34);                    // '!'
      break;
    case 271:                       // '|'
      shift(271);                   // '|'
      break;
    case 2:                         // Annotation
      shift(2);                     // Annotation
      break;
    case 1:                         // ModuleDecl
      shift(1);                     // ModuleDecl
      break;
    case 3:                         // OptionDecl
      shift(3);                     // OptionDecl
      break;
    case 12:                        // AttrTest
      shift(12);                    // AttrTest
      break;
    case 13:                        // Wildcard
      shift(13);                    // Wildcard
      break;
    case 15:                        // IntegerLiteral
      shift(15);                    // IntegerLiteral
      break;
    case 16:                        // DecimalLiteral
      shift(16);                    // DecimalLiteral
      break;
    case 17:                        // DoubleLiteral
      shift(17);                    // DoubleLiteral
      break;
    case 5:                         // Variable
      shift(5);                     // Variable
      break;
    case 6:                         // Tag
      shift(6);                     // Tag
      break;
    case 4:                         // Operator
      shift(4);                     // Operator
      break;
    case 33:                        // EOF
      shift(33);                    // EOF
      break;
    default:
      parse_EQName();
    }
    eventHandler.endNonterminal("start", e0);
  };

  this.parse_StartTag = function()
  {
    eventHandler.startNonterminal("StartTag", e0);
    lookahead1W(8);                 // QName | S^WS | EOF | '"' | "'" | '/>' | '=' | '>'
    switch (l1)
    {
    case 57:                        // '>'
      shift(57);                    // '>'
      break;
    case 49:                        // '/>'
      shift(49);                    // '/>'
      break;
    case 27:                        // QName
      shift(27);                    // QName
      break;
    case 56:                        // '='
      shift(56);                    // '='
      break;
    case 35:                        // '"'
      shift(35);                    // '"'
      break;
    case 37:                        // "'"
      shift(37);                    // "'"
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("StartTag", e0);
  };

  this.parse_TagContent = function()
  {
    eventHandler.startNonterminal("TagContent", e0);
    lookahead1(11);                 // Tag | EndTag | PredefinedEntityRef | ElementContentChar | CharRef | EOF |
    switch (l1)
    {
    case 23:                        // ElementContentChar
      shift(23);                    // ElementContentChar
      break;
    case 6:                         // Tag
      shift(6);                     // Tag
      break;
    case 7:                         // EndTag
      shift(7);                     // EndTag
      break;
    case 54:                        // '<![CDATA['
      shift(54);                    // '<![CDATA['
      break;
    case 53:                        // '<!--'
      shift(53);                    // '<!--'
      break;
    case 18:                        // PredefinedEntityRef
      shift(18);                    // PredefinedEntityRef
      break;
    case 29:                        // CharRef
      shift(29);                    // CharRef
      break;
    case 270:                       // '{{'
      shift(270);                   // '{{'
      break;
    case 273:                       // '}}'
      shift(273);                   // '}}'
      break;
    case 269:                       // '{'
      shift(269);                   // '{'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("TagContent", e0);
  };

  this.parse_AposAttr = function()
  {
    eventHandler.startNonterminal("AposAttr", e0);
    lookahead1(10);                 // PredefinedEntityRef | EscapeApos | AposAttrContentChar | CharRef | EOF | "'" |
    switch (l1)
    {
    case 20:                        // EscapeApos
      shift(20);                    // EscapeApos
      break;
    case 25:                        // AposAttrContentChar
      shift(25);                    // AposAttrContentChar
      break;
    case 18:                        // PredefinedEntityRef
      shift(18);                    // PredefinedEntityRef
      break;
    case 29:                        // CharRef
      shift(29);                    // CharRef
      break;
    case 270:                       // '{{'
      shift(270);                   // '{{'
      break;
    case 273:                       // '}}'
      shift(273);                   // '}}'
      break;
    case 269:                       // '{'
      shift(269);                   // '{'
      break;
    case 37:                        // "'"
      shift(37);                    // "'"
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("AposAttr", e0);
  };

  this.parse_QuotAttr = function()
  {
    eventHandler.startNonterminal("QuotAttr", e0);
    lookahead1(9);                  // PredefinedEntityRef | EscapeQuot | QuotAttrContentChar | CharRef | EOF | '"' |
    switch (l1)
    {
    case 19:                        // EscapeQuot
      shift(19);                    // EscapeQuot
      break;
    case 24:                        // QuotAttrContentChar
      shift(24);                    // QuotAttrContentChar
      break;
    case 18:                        // PredefinedEntityRef
      shift(18);                    // PredefinedEntityRef
      break;
    case 29:                        // CharRef
      shift(29);                    // CharRef
      break;
    case 270:                       // '{{'
      shift(270);                   // '{{'
      break;
    case 273:                       // '}}'
      shift(273);                   // '}}'
      break;
    case 269:                       // '{'
      shift(269);                   // '{'
      break;
    case 35:                        // '"'
      shift(35);                    // '"'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("QuotAttr", e0);
  };

  this.parse_CData = function()
  {
    eventHandler.startNonterminal("CData", e0);
    lookahead1(3);                  // CDataSectionContents | EOF | ']]>'
    switch (l1)
    {
    case 11:                        // CDataSectionContents
      shift(11);                    // CDataSectionContents
      break;
    case 62:                        // ']]>'
      shift(62);                    // ']]>'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("CData", e0);
  };

  this.parse_XMLComment = function()
  {
    eventHandler.startNonterminal("XMLComment", e0);
    lookahead1(1);                  // DirCommentContents | EOF | '-->'
    switch (l1)
    {
    case 9:                         // DirCommentContents
      shift(9);                     // DirCommentContents
      break;
    case 46:                        // '-->'
      shift(46);                    // '-->'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("XMLComment", e0);
  };

  this.parse_PI = function()
  {
    eventHandler.startNonterminal("PI", e0);
    lookahead1(2);                  // DirPIContents | EOF | '?>'
    switch (l1)
    {
    case 10:                        // DirPIContents
      shift(10);                    // DirPIContents
      break;
    case 58:                        // '?>'
      shift(58);                    // '?>'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("PI", e0);
  };

  this.parse_Pragma = function()
  {
    eventHandler.startNonterminal("Pragma", e0);
    lookahead1(0);                  // PragmaContents | EOF | '#)'
    switch (l1)
    {
    case 8:                         // PragmaContents
      shift(8);                     // PragmaContents
      break;
    case 36:                        // '#)'
      shift(36);                    // '#)'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("Pragma", e0);
  };

  this.parse_Comment = function()
  {
    eventHandler.startNonterminal("Comment", e0);
    lookahead1(4);                  // CommentContents | EOF | '(:' | ':)'
    switch (l1)
    {
    case 51:                        // ':)'
      shift(51);                    // ':)'
      break;
    case 40:                        // '(:'
      shift(40);                    // '(:'
      break;
    case 30:                        // CommentContents
      shift(30);                    // CommentContents
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("Comment", e0);
  };

  this.parse_CommentDoc = function()
  {
    eventHandler.startNonterminal("CommentDoc", e0);
    lookahead1(5);                  // DocTag | DocCommentContents | EOF | '(:' | ':)'
    switch (l1)
    {
    case 31:                        // DocTag
      shift(31);                    // DocTag
      break;
    case 32:                        // DocCommentContents
      shift(32);                    // DocCommentContents
      break;
    case 51:                        // ':)'
      shift(51);                    // ':)'
      break;
    case 40:                        // '(:'
      shift(40);                    // '(:'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("CommentDoc", e0);
  };

  this.parse_QuotString = function()
  {
    eventHandler.startNonterminal("QuotString", e0);
    lookahead1(6);                  // PredefinedEntityRef | EscapeQuot | QuotChar | CharRef | EOF | '"'
    switch (l1)
    {
    case 18:                        // PredefinedEntityRef
      shift(18);                    // PredefinedEntityRef
      break;
    case 29:                        // CharRef
      shift(29);                    // CharRef
      break;
    case 19:                        // EscapeQuot
      shift(19);                    // EscapeQuot
      break;
    case 21:                        // QuotChar
      shift(21);                    // QuotChar
      break;
    case 35:                        // '"'
      shift(35);                    // '"'
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("QuotString", e0);
  };

  this.parse_AposString = function()
  {
    eventHandler.startNonterminal("AposString", e0);
    lookahead1(7);                  // PredefinedEntityRef | EscapeApos | AposChar | CharRef | EOF | "'"
    switch (l1)
    {
    case 18:                        // PredefinedEntityRef
      shift(18);                    // PredefinedEntityRef
      break;
    case 29:                        // CharRef
      shift(29);                    // CharRef
      break;
    case 20:                        // EscapeApos
      shift(20);                    // EscapeApos
      break;
    case 22:                        // AposChar
      shift(22);                    // AposChar
      break;
    case 37:                        // "'"
      shift(37);                    // "'"
      break;
    default:
      shift(33);                    // EOF
    }
    eventHandler.endNonterminal("AposString", e0);
  };

  this.parse_Prefix = function()
  {
    eventHandler.startNonterminal("Prefix", e0);
    lookahead1W(13);                // NCName^Token | S^WS | 'after' | 'allowing' | 'ancestor' | 'ancestor-or-self' |
    whitespace();
    parse_NCName();
    eventHandler.endNonterminal("Prefix", e0);
  };

  this.parse__EQName = function()
  {
    eventHandler.startNonterminal("_EQName", e0);
    lookahead1W(12);                // EQName^Token | S^WS | 'after' | 'allowing' | 'ancestor' | 'ancestor-or-self' |
    whitespace();
    parse_EQName();
    eventHandler.endNonterminal("_EQName", e0);
  };

  function parse_EQName()
  {
    eventHandler.startNonterminal("EQName", e0);
    switch (l1)
    {
    case 75:                        // 'attribute'
      shift(75);                    // 'attribute'
      break;
    case 89:                        // 'comment'
      shift(89);                    // 'comment'
      break;
    case 113:                       // 'document-node'
      shift(113);                   // 'document-node'
      break;
    case 114:                       // 'element'
      shift(114);                   // 'element'
      break;
    case 117:                       // 'empty-sequence'
      shift(117);                   // 'empty-sequence'
      break;
    case 138:                       // 'function'
      shift(138);                   // 'function'
      break;
    case 145:                       // 'if'
      shift(145);                   // 'if'
      break;
    case 158:                       // 'item'
      shift(158);                   // 'item'
      break;
    case 178:                       // 'namespace-node'
      shift(178);                   // 'namespace-node'
      break;
    case 184:                       // 'node'
      shift(184);                   // 'node'
      break;
    case 209:                       // 'processing-instruction'
      shift(209);                   // 'processing-instruction'
      break;
    case 219:                       // 'schema-attribute'
      shift(219);                   // 'schema-attribute'
      break;
    case 220:                       // 'schema-element'
      shift(220);                   // 'schema-element'
      break;
    case 236:                       // 'switch'
      shift(236);                   // 'switch'
      break;
    case 237:                       // 'text'
      shift(237);                   // 'text'
      break;
    case 246:                       // 'typeswitch'
      shift(246);                   // 'typeswitch'
      break;
    default:
      parse_FunctionName();
    }
    eventHandler.endNonterminal("EQName", e0);
  }

  function parse_FunctionName()
  {
    eventHandler.startNonterminal("FunctionName", e0);
    switch (l1)
    {
    case 14:                        // EQName^Token
      shift(14);                    // EQName^Token
      break;
    case 63:                        // 'after'
      shift(63);                    // 'after'
      break;
    case 66:                        // 'ancestor'
      shift(66);                    // 'ancestor'
      break;
    case 67:                        // 'ancestor-or-self'
      shift(67);                    // 'ancestor-or-self'
      break;
    case 68:                        // 'and'
      shift(68);                    // 'and'
      break;
    case 72:                        // 'as'
      shift(72);                    // 'as'
      break;
    case 73:                        // 'ascending'
      shift(73);                    // 'ascending'
      break;
    case 77:                        // 'before'
      shift(77);                    // 'before'
      break;
    case 81:                        // 'case'
      shift(81);                    // 'case'
      break;
    case 82:                        // 'cast'
      shift(82);                    // 'cast'
      break;
    case 83:                        // 'castable'
      shift(83);                    // 'castable'
      break;
    case 86:                        // 'child'
      shift(86);                    // 'child'
      break;
    case 87:                        // 'collation'
      shift(87);                    // 'collation'
      break;
    case 96:                        // 'copy'
      shift(96);                    // 'copy'
      break;
    case 98:                        // 'count'
      shift(98);                    // 'count'
      break;
    case 101:                       // 'declare'
      shift(101);                   // 'declare'
      break;
    case 102:                       // 'default'
      shift(102);                   // 'default'
      break;
    case 103:                       // 'delete'
      shift(103);                   // 'delete'
      break;
    case 104:                       // 'descendant'
      shift(104);                   // 'descendant'
      break;
    case 105:                       // 'descendant-or-self'
      shift(105);                   // 'descendant-or-self'
      break;
    case 106:                       // 'descending'
      shift(106);                   // 'descending'
      break;
    case 111:                       // 'div'
      shift(111);                   // 'div'
      break;
    case 112:                       // 'document'
      shift(112);                   // 'document'
      break;
    case 115:                       // 'else'
      shift(115);                   // 'else'
      break;
    case 116:                       // 'empty'
      shift(116);                   // 'empty'
      break;
    case 119:                       // 'end'
      shift(119);                   // 'end'
      break;
    case 121:                       // 'eq'
      shift(121);                   // 'eq'
      break;
    case 122:                       // 'every'
      shift(122);                   // 'every'
      break;
    case 124:                       // 'except'
      shift(124);                   // 'except'
      break;
    case 127:                       // 'first'
      shift(127);                   // 'first'
      break;
    case 128:                       // 'following'
      shift(128);                   // 'following'
      break;
    case 129:                       // 'following-sibling'
      shift(129);                   // 'following-sibling'
      break;
    case 130:                       // 'for'
      shift(130);                   // 'for'
      break;
    case 139:                       // 'ge'
      shift(139);                   // 'ge'
      break;
    case 141:                       // 'group'
      shift(141);                   // 'group'
      break;
    case 143:                       // 'gt'
      shift(143);                   // 'gt'
      break;
    case 144:                       // 'idiv'
      shift(144);                   // 'idiv'
      break;
    case 146:                       // 'import'
      shift(146);                   // 'import'
      break;
    case 152:                       // 'insert'
      shift(152);                   // 'insert'
      break;
    case 153:                       // 'instance'
      shift(153);                   // 'instance'
      break;
    case 155:                       // 'intersect'
      shift(155);                   // 'intersect'
      break;
    case 156:                       // 'into'
      shift(156);                   // 'into'
      break;
    case 157:                       // 'is'
      shift(157);                   // 'is'
      break;
    case 163:                       // 'last'
      shift(163);                   // 'last'
      break;
    case 165:                       // 'le'
      shift(165);                   // 'le'
      break;
    case 167:                       // 'let'
      shift(167);                   // 'let'
      break;
    case 171:                       // 'lt'
      shift(171);                   // 'lt'
      break;
    case 173:                       // 'mod'
      shift(173);                   // 'mod'
      break;
    case 174:                       // 'modify'
      shift(174);                   // 'modify'
      break;
    case 175:                       // 'module'
      shift(175);                   // 'module'
      break;
    case 177:                       // 'namespace'
      shift(177);                   // 'namespace'
      break;
    case 179:                       // 'ne'
      shift(179);                   // 'ne'
      break;
    case 191:                       // 'only'
      shift(191);                   // 'only'
      break;
    case 193:                       // 'or'
      shift(193);                   // 'or'
      break;
    case 194:                       // 'order'
      shift(194);                   // 'order'
      break;
    case 195:                       // 'ordered'
      shift(195);                   // 'ordered'
      break;
    case 199:                       // 'parent'
      shift(199);                   // 'parent'
      break;
    case 205:                       // 'preceding'
      shift(205);                   // 'preceding'
      break;
    case 206:                       // 'preceding-sibling'
      shift(206);                   // 'preceding-sibling'
      break;
    case 211:                       // 'rename'
      shift(211);                   // 'rename'
      break;
    case 212:                       // 'replace'
      shift(212);                   // 'replace'
      break;
    case 213:                       // 'return'
      shift(213);                   // 'return'
      break;
    case 217:                       // 'satisfies'
      shift(217);                   // 'satisfies'
      break;
    case 222:                       // 'self'
      shift(222);                   // 'self'
      break;
    case 228:                       // 'some'
      shift(228);                   // 'some'
      break;
    case 229:                       // 'stable'
      shift(229);                   // 'stable'
      break;
    case 230:                       // 'start'
      shift(230);                   // 'start'
      break;
    case 241:                       // 'to'
      shift(241);                   // 'to'
      break;
    case 242:                       // 'treat'
      shift(242);                   // 'treat'
      break;
    case 243:                       // 'try'
      shift(243);                   // 'try'
      break;
    case 247:                       // 'union'
      shift(247);                   // 'union'
      break;
    case 249:                       // 'unordered'
      shift(249);                   // 'unordered'
      break;
    case 253:                       // 'validate'
      shift(253);                   // 'validate'
      break;
    case 259:                       // 'where'
      shift(259);                   // 'where'
      break;
    case 263:                       // 'with'
      shift(263);                   // 'with'
      break;
    case 267:                       // 'xquery'
      shift(267);                   // 'xquery'
      break;
    case 65:                        // 'allowing'
      shift(65);                    // 'allowing'
      break;
    case 74:                        // 'at'
      shift(74);                    // 'at'
      break;
    case 76:                        // 'base-uri'
      shift(76);                    // 'base-uri'
      break;
    case 78:                        // 'boundary-space'
      shift(78);                    // 'boundary-space'
      break;
    case 79:                        // 'break'
      shift(79);                    // 'break'
      break;
    case 84:                        // 'catch'
      shift(84);                    // 'catch'
      break;
    case 91:                        // 'construction'
      shift(91);                    // 'construction'
      break;
    case 94:                        // 'context'
      shift(94);                    // 'context'
      break;
    case 95:                        // 'continue'
      shift(95);                    // 'continue'
      break;
    case 97:                        // 'copy-namespaces'
      shift(97);                    // 'copy-namespaces'
      break;
    case 99:                        // 'decimal-format'
      shift(99);                    // 'decimal-format'
      break;
    case 118:                       // 'encoding'
      shift(118);                   // 'encoding'
      break;
    case 125:                       // 'exit'
      shift(125);                   // 'exit'
      break;
    case 126:                       // 'external'
      shift(126);                   // 'external'
      break;
    case 134:                       // 'ft-option'
      shift(134);                   // 'ft-option'
      break;
    case 147:                       // 'in'
      shift(147);                   // 'in'
      break;
    case 148:                       // 'index'
      shift(148);                   // 'index'
      break;
    case 154:                       // 'integrity'
      shift(154);                   // 'integrity'
      break;
    case 164:                       // 'lax'
      shift(164);                   // 'lax'
      break;
    case 185:                       // 'nodes'
      shift(185);                   // 'nodes'
      break;
    case 192:                       // 'option'
      shift(192);                   // 'option'
      break;
    case 196:                       // 'ordering'
      shift(196);                   // 'ordering'
      break;
    case 215:                       // 'revalidation'
      shift(215);                   // 'revalidation'
      break;
    case 218:                       // 'schema'
      shift(218);                   // 'schema'
      break;
    case 221:                       // 'score'
      shift(221);                   // 'score'
      break;
    case 227:                       // 'sliding'
      shift(227);                   // 'sliding'
      break;
    case 233:                       // 'strict'
      shift(233);                   // 'strict'
      break;
    case 244:                       // 'tumbling'
      shift(244);                   // 'tumbling'
      break;
    case 245:                       // 'type'
      shift(245);                   // 'type'
      break;
    case 250:                       // 'updating'
      shift(250);                   // 'updating'
      break;
    case 254:                       // 'value'
      shift(254);                   // 'value'
      break;
    case 255:                       // 'variable'
      shift(255);                   // 'variable'
      break;
    case 256:                       // 'version'
      shift(256);                   // 'version'
      break;
    case 260:                       // 'while'
      shift(260);                   // 'while'
      break;
    case 90:                        // 'constraint'
      shift(90);                    // 'constraint'
      break;
    case 169:                       // 'loop'
      shift(169);                   // 'loop'
      break;
    default:
      shift(214);                   // 'returning'
    }
    eventHandler.endNonterminal("FunctionName", e0);
  }

  function parse_NCName()
  {
    eventHandler.startNonterminal("NCName", e0);
    switch (l1)
    {
    case 26:                        // NCName^Token
      shift(26);                    // NCName^Token
      break;
    case 63:                        // 'after'
      shift(63);                    // 'after'
      break;
    case 68:                        // 'and'
      shift(68);                    // 'and'
      break;
    case 72:                        // 'as'
      shift(72);                    // 'as'
      break;
    case 73:                        // 'ascending'
      shift(73);                    // 'ascending'
      break;
    case 77:                        // 'before'
      shift(77);                    // 'before'
      break;
    case 81:                        // 'case'
      shift(81);                    // 'case'
      break;
    case 82:                        // 'cast'
      shift(82);                    // 'cast'
      break;
    case 83:                        // 'castable'
      shift(83);                    // 'castable'
      break;
    case 87:                        // 'collation'
      shift(87);                    // 'collation'
      break;
    case 98:                        // 'count'
      shift(98);                    // 'count'
      break;
    case 102:                       // 'default'
      shift(102);                   // 'default'
      break;
    case 106:                       // 'descending'
      shift(106);                   // 'descending'
      break;
    case 111:                       // 'div'
      shift(111);                   // 'div'
      break;
    case 115:                       // 'else'
      shift(115);                   // 'else'
      break;
    case 116:                       // 'empty'
      shift(116);                   // 'empty'
      break;
    case 119:                       // 'end'
      shift(119);                   // 'end'
      break;
    case 121:                       // 'eq'
      shift(121);                   // 'eq'
      break;
    case 124:                       // 'except'
      shift(124);                   // 'except'
      break;
    case 130:                       // 'for'
      shift(130);                   // 'for'
      break;
    case 139:                       // 'ge'
      shift(139);                   // 'ge'
      break;
    case 141:                       // 'group'
      shift(141);                   // 'group'
      break;
    case 143:                       // 'gt'
      shift(143);                   // 'gt'
      break;
    case 144:                       // 'idiv'
      shift(144);                   // 'idiv'
      break;
    case 153:                       // 'instance'
      shift(153);                   // 'instance'
      break;
    case 155:                       // 'intersect'
      shift(155);                   // 'intersect'
      break;
    case 156:                       // 'into'
      shift(156);                   // 'into'
      break;
    case 157:                       // 'is'
      shift(157);                   // 'is'
      break;
    case 165:                       // 'le'
      shift(165);                   // 'le'
      break;
    case 167:                       // 'let'
      shift(167);                   // 'let'
      break;
    case 171:                       // 'lt'
      shift(171);                   // 'lt'
      break;
    case 173:                       // 'mod'
      shift(173);                   // 'mod'
      break;
    case 174:                       // 'modify'
      shift(174);                   // 'modify'
      break;
    case 179:                       // 'ne'
      shift(179);                   // 'ne'
      break;
    case 191:                       // 'only'
      shift(191);                   // 'only'
      break;
    case 193:                       // 'or'
      shift(193);                   // 'or'
      break;
    case 194:                       // 'order'
      shift(194);                   // 'order'
      break;
    case 213:                       // 'return'
      shift(213);                   // 'return'
      break;
    case 217:                       // 'satisfies'
      shift(217);                   // 'satisfies'
      break;
    case 229:                       // 'stable'
      shift(229);                   // 'stable'
      break;
    case 230:                       // 'start'
      shift(230);                   // 'start'
      break;
    case 241:                       // 'to'
      shift(241);                   // 'to'
      break;
    case 242:                       // 'treat'
      shift(242);                   // 'treat'
      break;
    case 247:                       // 'union'
      shift(247);                   // 'union'
      break;
    case 259:                       // 'where'
      shift(259);                   // 'where'
      break;
    case 263:                       // 'with'
      shift(263);                   // 'with'
      break;
    case 66:                        // 'ancestor'
      shift(66);                    // 'ancestor'
      break;
    case 67:                        // 'ancestor-or-self'
      shift(67);                    // 'ancestor-or-self'
      break;
    case 75:                        // 'attribute'
      shift(75);                    // 'attribute'
      break;
    case 86:                        // 'child'
      shift(86);                    // 'child'
      break;
    case 89:                        // 'comment'
      shift(89);                    // 'comment'
      break;
    case 96:                        // 'copy'
      shift(96);                    // 'copy'
      break;
    case 101:                       // 'declare'
      shift(101);                   // 'declare'
      break;
    case 103:                       // 'delete'
      shift(103);                   // 'delete'
      break;
    case 104:                       // 'descendant'
      shift(104);                   // 'descendant'
      break;
    case 105:                       // 'descendant-or-self'
      shift(105);                   // 'descendant-or-self'
      break;
    case 112:                       // 'document'
      shift(112);                   // 'document'
      break;
    case 113:                       // 'document-node'
      shift(113);                   // 'document-node'
      break;
    case 114:                       // 'element'
      shift(114);                   // 'element'
      break;
    case 117:                       // 'empty-sequence'
      shift(117);                   // 'empty-sequence'
      break;
    case 122:                       // 'every'
      shift(122);                   // 'every'
      break;
    case 127:                       // 'first'
      shift(127);                   // 'first'
      break;
    case 128:                       // 'following'
      shift(128);                   // 'following'
      break;
    case 129:                       // 'following-sibling'
      shift(129);                   // 'following-sibling'
      break;
    case 138:                       // 'function'
      shift(138);                   // 'function'
      break;
    case 145:                       // 'if'
      shift(145);                   // 'if'
      break;
    case 146:                       // 'import'
      shift(146);                   // 'import'
      break;
    case 152:                       // 'insert'
      shift(152);                   // 'insert'
      break;
    case 158:                       // 'item'
      shift(158);                   // 'item'
      break;
    case 163:                       // 'last'
      shift(163);                   // 'last'
      break;
    case 175:                       // 'module'
      shift(175);                   // 'module'
      break;
    case 177:                       // 'namespace'
      shift(177);                   // 'namespace'
      break;
    case 178:                       // 'namespace-node'
      shift(178);                   // 'namespace-node'
      break;
    case 184:                       // 'node'
      shift(184);                   // 'node'
      break;
    case 195:                       // 'ordered'
      shift(195);                   // 'ordered'
      break;
    case 199:                       // 'parent'
      shift(199);                   // 'parent'
      break;
    case 205:                       // 'preceding'
      shift(205);                   // 'preceding'
      break;
    case 206:                       // 'preceding-sibling'
      shift(206);                   // 'preceding-sibling'
      break;
    case 209:                       // 'processing-instruction'
      shift(209);                   // 'processing-instruction'
      break;
    case 211:                       // 'rename'
      shift(211);                   // 'rename'
      break;
    case 212:                       // 'replace'
      shift(212);                   // 'replace'
      break;
    case 219:                       // 'schema-attribute'
      shift(219);                   // 'schema-attribute'
      break;
    case 220:                       // 'schema-element'
      shift(220);                   // 'schema-element'
      break;
    case 222:                       // 'self'
      shift(222);                   // 'self'
      break;
    case 228:                       // 'some'
      shift(228);                   // 'some'
      break;
    case 236:                       // 'switch'
      shift(236);                   // 'switch'
      break;
    case 237:                       // 'text'
      shift(237);                   // 'text'
      break;
    case 243:                       // 'try'
      shift(243);                   // 'try'
      break;
    case 246:                       // 'typeswitch'
      shift(246);                   // 'typeswitch'
      break;
    case 249:                       // 'unordered'
      shift(249);                   // 'unordered'
      break;
    case 253:                       // 'validate'
      shift(253);                   // 'validate'
      break;
    case 255:                       // 'variable'
      shift(255);                   // 'variable'
      break;
    case 267:                       // 'xquery'
      shift(267);                   // 'xquery'
      break;
    case 65:                        // 'allowing'
      shift(65);                    // 'allowing'
      break;
    case 74:                        // 'at'
      shift(74);                    // 'at'
      break;
    case 76:                        // 'base-uri'
      shift(76);                    // 'base-uri'
      break;
    case 78:                        // 'boundary-space'
      shift(78);                    // 'boundary-space'
      break;
    case 79:                        // 'break'
      shift(79);                    // 'break'
      break;
    case 84:                        // 'catch'
      shift(84);                    // 'catch'
      break;
    case 91:                        // 'construction'
      shift(91);                    // 'construction'
      break;
    case 94:                        // 'context'
      shift(94);                    // 'context'
      break;
    case 95:                        // 'continue'
      shift(95);                    // 'continue'
      break;
    case 97:                        // 'copy-namespaces'
      shift(97);                    // 'copy-namespaces'
      break;
    case 99:                        // 'decimal-format'
      shift(99);                    // 'decimal-format'
      break;
    case 118:                       // 'encoding'
      shift(118);                   // 'encoding'
      break;
    case 125:                       // 'exit'
      shift(125);                   // 'exit'
      break;
    case 126:                       // 'external'
      shift(126);                   // 'external'
      break;
    case 134:                       // 'ft-option'
      shift(134);                   // 'ft-option'
      break;
    case 147:                       // 'in'
      shift(147);                   // 'in'
      break;
    case 148:                       // 'index'
      shift(148);                   // 'index'
      break;
    case 154:                       // 'integrity'
      shift(154);                   // 'integrity'
      break;
    case 164:                       // 'lax'
      shift(164);                   // 'lax'
      break;
    case 185:                       // 'nodes'
      shift(185);                   // 'nodes'
      break;
    case 192:                       // 'option'
      shift(192);                   // 'option'
      break;
    case 196:                       // 'ordering'
      shift(196);                   // 'ordering'
      break;
    case 215:                       // 'revalidation'
      shift(215);                   // 'revalidation'
      break;
    case 218:                       // 'schema'
      shift(218);                   // 'schema'
      break;
    case 221:                       // 'score'
      shift(221);                   // 'score'
      break;
    case 227:                       // 'sliding'
      shift(227);                   // 'sliding'
      break;
    case 233:                       // 'strict'
      shift(233);                   // 'strict'
      break;
    case 244:                       // 'tumbling'
      shift(244);                   // 'tumbling'
      break;
    case 245:                       // 'type'
      shift(245);                   // 'type'
      break;
    case 250:                       // 'updating'
      shift(250);                   // 'updating'
      break;
    case 254:                       // 'value'
      shift(254);                   // 'value'
      break;
    case 256:                       // 'version'
      shift(256);                   // 'version'
      break;
    case 260:                       // 'while'
      shift(260);                   // 'while'
      break;
    case 90:                        // 'constraint'
      shift(90);                    // 'constraint'
      break;
    case 169:                       // 'loop'
      shift(169);                   // 'loop'
      break;
    default:
      shift(214);                   // 'returning'
    }
    eventHandler.endNonterminal("NCName", e0);
  }

  var lk, b0, e0;
  var l1, b1, e1;
  var eventHandler;

  function error(b, e, s, l, t)
  {
    throw new self.ParseException(b, e, s, l, t);
  }

  function shift(t)
  {
    if (l1 == t)
    {
      whitespace();
      eventHandler.terminal(XQueryTokenizer.TOKEN[l1], b1, e1 > size ? size : e1);
      b0 = b1; e0 = e1; l1 = 0;
    }
    else
    {
      error(b1, e1, 0, l1, t);
    }
  }

  function whitespace()
  {
    if (e0 != b1)
    {
      b0 = e0;
      e0 = b1;
      eventHandler.whitespace(b0, e0);
    }
  }

  function matchW(set)
  {
    var code;
    for (;;)
    {
      code = match(set);
      if (code != 28)               // S^WS
      {
        break;
      }
    }
    return code;
  }

  function lookahead1W(set)
  {
    if (l1 == 0)
    {
      l1 = matchW(set);
      b1 = begin;
      e1 = end;
    }
  }

  function lookahead1(set)
  {
    if (l1 == 0)
    {
      l1 = match(set);
      b1 = begin;
      e1 = end;
    }
  }

  var input;
  var size;
  var begin;
  var end;

  function match(tokenSetId)
  {
    var nonbmp = false;
    begin = end;
    var current = end;
    var result = XQueryTokenizer.INITIAL[tokenSetId];
    var state = 0;

    for (var code = result & 4095; code != 0; )
    {
      var charclass;
      var c0 = current < size ? input.charCodeAt(current) : 0;
      ++current;
      if (c0 < 0x80)
      {
        charclass = XQueryTokenizer.MAP0[c0];
      }
      else if (c0 < 0xd800)
      {
        var c1 = c0 >> 4;
        charclass = XQueryTokenizer.MAP1[(c0 & 15) + XQueryTokenizer.MAP1[(c1 & 31) + XQueryTokenizer.MAP1[c1 >> 5]]];
      }
      else
      {
        if (c0 < 0xdc00)
        {
          var c1 = current < size ? input.charCodeAt(current) : 0;
          if (c1 >= 0xdc00 && c1 < 0xe000)
          {
            ++current;
            c0 = ((c0 & 0x3ff) << 10) + (c1 & 0x3ff) + 0x10000;
            nonbmp = true;
          }
        }
        var lo = 0, hi = 5;
        for (var m = 3; ; m = (hi + lo) >> 1)
        {
          if (XQueryTokenizer.MAP2[m] > c0) hi = m - 1;
          else if (XQueryTokenizer.MAP2[6 + m] < c0) lo = m + 1;
          else {charclass = XQueryTokenizer.MAP2[12 + m]; break;}
          if (lo > hi) {charclass = 0; break;}
        }
      }

      state = code;
      var i0 = (charclass << 12) + code - 1;
      code = XQueryTokenizer.TRANSITION[(i0 & 15) + XQueryTokenizer.TRANSITION[i0 >> 4]];

      if (code > 4095)
      {
        result = code;
        code &= 4095;
        end = current;
      }
    }

    result >>= 12;
    if (result == 0)
    {
      end = current - 1;
      var c1 = end < size ? input.charCodeAt(end) : 0;
      if (c1 >= 0xdc00 && c1 < 0xe000) --end;
      return error(begin, end, state, -1, -1);
    }

    if (nonbmp)
    {
      for (var i = result >> 9; i > 0; --i)
      {
        --end;
        var c1 = end < size ? input.charCodeAt(end) : 0;
        if (c1 >= 0xdc00 && c1 < 0xe000) --end;
      }
    }
    else
    {
      end -= result >> 9;
    }

    return (result & 511) - 1;
  }
}

XQueryTokenizer.getTokenSet = function(tokenSetId)
{
  var set = [];
  var s = tokenSetId < 0 ? - tokenSetId : INITIAL[tokenSetId] & 4095;
  for (var i = 0; i < 274; i += 32)
  {
    var j = i;
    var i0 = (i >> 5) * 2066 + s - 1;
    var i1 = i0 >> 2;
    var i2 = i1 >> 2;
    var f = XQueryTokenizer.EXPECTED[(i0 & 3) + XQueryTokenizer.EXPECTED[(i1 & 3) + XQueryTokenizer.EXPECTED[(i2 & 3) + XQueryTokenizer.EXPECTED[i2 >> 2]]]];
    for ( ; f != 0; f >>>= 1, ++j)
    {
      if ((f & 1) != 0)
      {
        set.push(XQueryTokenizer.TOKEN[j]);
      }
    }
  }
  return set;
};

XQueryTokenizer.MAP0 =
[
];

XQueryTokenizer.MAP1 =
[
];

XQueryTokenizer.MAP2 =
[
];

XQueryTokenizer.INITIAL =
[
];

XQueryTokenizer.TRANSITION =
[
];

XQueryTokenizer.EXPECTED =
[
];

XQueryTokenizer.TOKEN =
[
  "(0)",
  "ModuleDecl",
  "Annotation",
  "OptionDecl",
  "Operator",
  "Variable",
  "Tag",
  "EndTag",
  "PragmaContents",
  "DirCommentContents",
  "DirPIContents",
  "CDataSectionContents",
  "AttrTest",
  "Wildcard",
  "EQName",
  "IntegerLiteral",
  "DecimalLiteral",
  "DoubleLiteral",
  "PredefinedEntityRef",
  "'\"\"'",
  "EscapeApos",
  "QuotChar",
  "AposChar",
  "ElementContentChar",
  "QuotAttrContentChar",
  "AposAttrContentChar",
  "NCName",
  "QName",
  "S",
  "CharRef",
  "CommentContents",
  "DocTag",
  "DocCommentContents",
  "EOF",
  "'!'",
  "'\"'",
  "'#)'",
  "''''",
  "'('",
  "'(#'",
  "'(:'",
  "'(:~'",
  "')'",
  "'*'",
  "'*'",
  "','",
  "'-->'",
  "'.'",
  "'/'",
  "'/>'",
  "':'",
  "':)'",
  "';'",
  "'<!--'",
  "'<![CDATA['",
  "'<?'",
  "'='",
  "'>'",
  "'?>'",
  "'NaN'",
  "'['",
  "']'",
  "']]>'",
  "'after'",
  "'all'",
  "'allowing'",
  "'ancestor'",
  "'ancestor-or-self'",
  "'and'",
  "'any'",
  "'append'",
  "'array'",
  "'as'",
  "'ascending'",
  "'at'",
  "'attribute'",
  "'base-uri'",
  "'before'",
  "'boundary-space'",
  "'break'",
  "'by'",
  "'case'",
  "'cast'",
  "'castable'",
  "'catch'",
  "'check'",
  "'child'",
  "'collation'",
  "'collection'",
  "'comment'",
  "'constraint'",
  "'construction'",
  "'contains'",
  "'content'",
  "'context'",
  "'continue'",
  "'copy'",
  "'copy-namespaces'",
  "'count'",
  "'decimal-format'",
  "'decimal-separator'",
  "'declare'",
  "'default'",
  "'delete'",
  "'descendant'",
  "'descendant-or-self'",
  "'descending'",
  "'diacritics'",
  "'different'",
  "'digit'",
  "'distance'",
  "'div'",
  "'document'",
  "'document-node'",
  "'element'",
  "'else'",
  "'empty'",
  "'empty-sequence'",
  "'encoding'",
  "'end'",
  "'entire'",
  "'eq'",
  "'every'",
  "'exactly'",
  "'except'",
  "'exit'",
  "'external'",
  "'first'",
  "'following'",
  "'following-sibling'",
  "'for'",
  "'foreach'",
  "'foreign'",
  "'from'",
  "'ft-option'",
  "'ftand'",
  "'ftnot'",
  "'ftor'",
  "'function'",
  "'ge'",
  "'greatest'",
  "'group'",
  "'grouping-separator'",
  "'gt'",
  "'idiv'",
  "'if'",
  "'import'",
  "'in'",
  "'index'",
  "'infinity'",
  "'inherit'",
  "'insensitive'",
  "'insert'",
  "'instance'",
  "'integrity'",
  "'intersect'",
  "'into'",
  "'is'",
  "'item'",
  "'json'",
  "'json-item'",
  "'key'",
  "'language'",
  "'last'",
  "'lax'",
  "'le'",
  "'least'",
  "'let'",
  "'levels'",
  "'loop'",
  "'lowercase'",
  "'lt'",
  "'minus-sign'",
  "'mod'",
  "'modify'",
  "'module'",
  "'most'",
  "'namespace'",
  "'namespace-node'",
  "'ne'",
  "'next'",
  "'no'",
  "'no-inherit'",
  "'no-preserve'",
  "'node'",
  "'nodes'",
  "'not'",
  "'object'",
  "'occurs'",
  "'of'",
  "'on'",
  "'only'",
  "'option'",
  "'or'",
  "'order'",
  "'ordered'",
  "'ordering'",
  "'paragraph'",
  "'paragraphs'",
  "'parent'",
  "'pattern-separator'",
  "'per-mille'",
  "'percent'",
  "'phrase'",
  "'position'",
  "'preceding'",
  "'preceding-sibling'",
  "'preserve'",
  "'previous'",
  "'processing-instruction'",
  "'relationship'",
  "'rename'",
  "'replace'",
  "'return'",
  "'returning'",
  "'revalidation'",
  "'same'",
  "'satisfies'",
  "'schema'",
  "'schema-attribute'",
  "'schema-element'",
  "'score'",
  "'self'",
  "'sensitive'",
  "'sentence'",
  "'sentences'",
  "'skip'",
  "'sliding'",
  "'some'",
  "'stable'",
  "'start'",
  "'stemming'",
  "'stop'",
  "'strict'",
  "'strip'",
  "'structured-item'",
  "'switch'",
  "'text'",
  "'then'",
  "'thesaurus'",
  "'times'",
  "'to'",
  "'treat'",
  "'try'",
  "'tumbling'",
  "'type'",
  "'typeswitch'",
  "'union'",
  "'unique'",
  "'unordered'",
  "'updating'",
  "'uppercase'",
  "'using'",
  "'validate'",
  "'value'",
  "'variable'",
  "'version'",
  "'weight'",
  "'when'",
  "'where'",
  "'while'",
  "'wildcards'",
  "'window'",
  "'with'",
  "'without'",
  "'word'",
  "'words'",
  "'xquery'",
  "'zero-digit'",
  "'{'",
  "'{{'",
  "'|'",
  "'}'",
  "'}}'"
];
                                                            });
define('ace/mode/behaviour/xquery', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/behaviour', 'ace/mode/behaviour/cstyle', 'ace/mode/behaviour/xml', 'ace/token_iterator'], function(require, exports, module) {


  var oop = require("../../lib/oop");
  var Behaviour = require('../behaviour').Behaviour;
  var CstyleBehaviour = require('./cstyle').CstyleBehaviour;
  var XmlBehaviour = require("../behaviour/xml").XmlBehaviour;
  var TokenIterator = require("../../token_iterator").TokenIterator;

function hasType(token, type) {
    var hasType = true;
    var typeList = token.type.split('.');
    var needleList = type.split('.');
    needleList.forEach(function(needle){
        if (typeList.indexOf(needle) == -1) {
            hasType = false;
            return false;
        }
    });
    return hasType;
}
 
  var XQueryBehaviour = function () {
      
      this.inherit(CstyleBehaviour, ["braces", "parens", "string_dquotes"]); // Get string behaviour
      this.inherit(XmlBehaviour); // Get xml behaviour
      
      this.add("autoclosing", "insertion", function (state, action, editor, session, text) {
        if (text == '>') {
            var position = editor.getCursorPosition();
            var iterator = new TokenIterator(session, position.row, position.column);
            var token = iterator.getCurrentToken();
            var atCursor = false;
            if (!token || !hasType(token, 'meta.tag') && !(hasType(token, 'text') && token.value.match('/'))){
                do {
                    token = iterator.stepBackward();
                } while (token && (hasType(token, 'string') || hasType(token, 'keyword.operator') || hasType(token, 'entity.attribute-name') || hasType(token, 'text')));
            } else {
                atCursor = true;
            }
            var previous = iterator.stepBackward();
            if (!token || !hasType(token, 'meta.tag') || (previous !== null && previous.value.match('/'))) {
                return
            }
            var tag = token.value.substring(1);
            if (atCursor){
                var tag = tag.substring(0, position.column - token.start);
            }

            return {
               text: '>' + '</' + tag + '>',
               selection: [1, 1]
            }
        }
    });

  }
  oop.inherits(XQueryBehaviour, Behaviour);

  exports.XQueryBehaviour = XQueryBehaviour;
});

define('ace/mode/behaviour/cstyle', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/behaviour', 'ace/token_iterator', 'ace/lib/lang'], function(require, exports, module) {


var oop = require("../../lib/oop");
var Behaviour = require("../behaviour").Behaviour;
var TokenIterator = require("../../token_iterator").TokenIterator;
var lang = require("../../lib/lang");

var SAFE_INSERT_IN_TOKENS =
    ["text", "paren.rparen", "punctuation.operator"];
var SAFE_INSERT_BEFORE_TOKENS =
    ["text", "paren.rparen", "punctuation.operator", "comment"];


var autoInsertedBrackets = 0;
var autoInsertedRow = -1;
var autoInsertedLineEnd = "";
var maybeInsertedBrackets = 0;
var maybeInsertedRow = -1;
var maybeInsertedLineStart = "";
var maybeInsertedLineEnd = "";

var CstyleBehaviour = function () {
    
    CstyleBehaviour.isSaneInsertion = function(editor, session) {
        var cursor = editor.getCursorPosition();
        var iterator = new TokenIterator(session, cursor.row, cursor.column);
        if (!this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) {
            var iterator2 = new TokenIterator(session, cursor.row, cursor.column + 1);
            if (!this.$matchTokenType(iterator2.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS))
                return false;
        }
        iterator.stepForward();
        return iterator.getCurrentTokenRow() !== cursor.row ||
            this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_BEFORE_TOKENS);
    };
    
    CstyleBehaviour.$matchTokenType = function(token, types) {
        return types.indexOf(token.type || token) > -1;
    };
    
    CstyleBehaviour.recordAutoInsert = function(editor, session, bracket) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (!this.isAutoInsertedClosing(cursor, line, autoInsertedLineEnd[0]))
            autoInsertedBrackets = 0;
        autoInsertedRow = cursor.row;
        autoInsertedLineEnd = bracket + line.substr(cursor.column);
        autoInsertedBrackets++;
    };
    
    CstyleBehaviour.recordMaybeInsert = function(editor, session, bracket) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (!this.isMaybeInsertedClosing(cursor, line))
            maybeInsertedBrackets = 0;
        maybeInsertedRow = cursor.row;
        maybeInsertedLineStart = line.substr(0, cursor.column) + bracket;
        maybeInsertedLineEnd = line.substr(cursor.column);
        maybeInsertedBrackets++;
    };
    
    CstyleBehaviour.isAutoInsertedClosing = function(cursor, line, bracket) {
        return autoInsertedBrackets > 0 &&
            cursor.row === autoInsertedRow &&
            bracket === autoInsertedLineEnd[0] &&
            line.substr(cursor.column) === autoInsertedLineEnd;
    };
    
    CstyleBehaviour.isMaybeInsertedClosing = function(cursor, line) {
        return maybeInsertedBrackets > 0 &&
            cursor.row === maybeInsertedRow &&
            line.substr(cursor.column) === maybeInsertedLineEnd &&
            line.substr(0, cursor.column) == maybeInsertedLineStart;
    };
    
    CstyleBehaviour.popAutoInsertedClosing = function() {
        autoInsertedLineEnd = autoInsertedLineEnd.substr(1);
        autoInsertedBrackets--;
    };
    
    CstyleBehaviour.clearMaybeInsertedClosing = function() {
        maybeInsertedBrackets = 0;
        maybeInsertedRow = -1;
    };

    this.add("braces", "insertion", function (state, action, editor, session, text) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (text == '{') {
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && selected !== "{" && editor.getWrapBehavioursEnabled()) {
                return {
                    text: '{' + selected + '}',
                    selection: false
                };
            } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                if (/[\]\}\)]/.test(line[cursor.column])) {
                    CstyleBehaviour.recordAutoInsert(editor, session, "}");
                    return {
                        text: '{}',
                        selection: [1, 1]
                    };
                } else {
                    CstyleBehaviour.recordMaybeInsert(editor, session, "{");
                    return {
                        text: '{',
                        selection: [1, 1]
                    };
                }
            }
        } else if (text == '}') {
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == '}') {
                var matching = session.$findOpeningBracket('}', {column: cursor.column + 1, row: cursor.row});
                if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                    CstyleBehaviour.popAutoInsertedClosing();
                    return {
                        text: '',
                        selection: [1, 1]
                    };
                }
            }
        } else if (text == "\n" || text == "\r\n") {
            var closing = "";
            if (CstyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
                closing = lang.stringRepeat("}", maybeInsertedBrackets);
                CstyleBehaviour.clearMaybeInsertedClosing();
            }
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == '}' || closing !== "") {
                var openBracePos = session.findMatchingBracket({row: cursor.row, column: cursor.column}, '}');
                if (!openBracePos)
                     return null;

                var indent = this.getNextLineIndent(state, line.substring(0, cursor.column), session.getTabString());
                var next_indent = this.$getIndent(line);

                return {
                    text: '\n' + indent + '\n' + next_indent + closing,
                    selection: [1, indent.length, 1, indent.length]
                };
            }
        }
    });

    this.add("braces", "deletion", function (state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '{') {
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.end.column, range.end.column + 1);
            if (rightChar == '}') {
                range.end.column++;
                return range;
            } else {
                maybeInsertedBrackets--;
            }
        }
    });

    this.add("parens", "insertion", function (state, action, editor, session, text) {
        if (text == '(') {
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                return {
                    text: '(' + selected + ')',
                    selection: false
                };
            } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                CstyleBehaviour.recordAutoInsert(editor, session, ")");
                return {
                    text: '()',
                    selection: [1, 1]
                };
            }
        } else if (text == ')') {
            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == ')') {
                var matching = session.$findOpeningBracket(')', {column: cursor.column + 1, row: cursor.row});
                if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                    CstyleBehaviour.popAutoInsertedClosing();
                    return {
                        text: '',
                        selection: [1, 1]
                    };
                }
            }
        }
    });

    this.add("parens", "deletion", function (state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '(') {
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
            if (rightChar == ')') {
                range.end.column++;
                return range;
            }
        }
    });

    this.add("brackets", "insertion", function (state, action, editor, session, text) {
        if (text == '[') {
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                return {
                    text: '[' + selected + ']',
                    selection: false
                };
            } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                CstyleBehaviour.recordAutoInsert(editor, session, "]");
                return {
                    text: '[]',
                    selection: [1, 1]
                };
            }
        } else if (text == ']') {
            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == ']') {
                var matching = session.$findOpeningBracket(']', {column: cursor.column + 1, row: cursor.row});
                if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                    CstyleBehaviour.popAutoInsertedClosing();
                    return {
                        text: '',
                        selection: [1, 1]
                    };
                }
            }
        }
    });

    this.add("brackets", "deletion", function (state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '[') {
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
            if (rightChar == ']') {
                range.end.column++;
                return range;
            }
        }
    });

    this.add("string_dquotes", "insertion", function (state, action, editor, session, text) {
        if (text == '"' || text == "'") {
            var quote = text;
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && selected !== "'" && selected != '"' && editor.getWrapBehavioursEnabled()) {
                return {
                    text: quote + selected + quote,
                    selection: false
                };
            } else {
                var cursor = editor.getCursorPosition();
                var line = session.doc.getLine(cursor.row);
                var leftChar = line.substring(cursor.column-1, cursor.column);
                if (leftChar == '\\') {
                    return null;
                }
                var tokens = session.getTokens(selection.start.row);
                var col = 0, token;
                var quotepos = -1; // Track whether we're inside an open quote.

                for (var x = 0; x < tokens.length; x++) {
                    token = tokens[x];
                    if (token.type == "string") {
                      quotepos = -1;
                    } else if (quotepos < 0) {
                      quotepos = token.value.indexOf(quote);
                    }
                    if ((token.value.length + col) > selection.start.column) {
                        break;
                    }
                    col += tokens[x].value.length;
                }
                if (!token || (quotepos < 0 && token.type !== "comment" && (token.type !== "string" || ((selection.start.column !== token.value.length+col-1) && token.value.lastIndexOf(quote) === token.value.length-1)))) {
                    if (!CstyleBehaviour.isSaneInsertion(editor, session))
                        return;
                    return {
                        text: quote + quote,
                        selection: [1,1]
                    };
                } else if (token && token.type === "string") {
                    var rightChar = line.substring(cursor.column, cursor.column + 1);
                    if (rightChar == quote) {
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            }
        }
    });

    this.add("string_dquotes", "deletion", function (state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
            if (rightChar == selected) {
                range.end.column++;
                return range;
            }
        }
    });

};

oop.inherits(CstyleBehaviour, Behaviour);

exports.CstyleBehaviour = CstyleBehaviour;
});

define('ace/mode/behaviour/xml', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/behaviour', 'ace/mode/behaviour/cstyle', 'ace/token_iterator'], function(require, exports, module) {


var oop = require("../../lib/oop");
var Behaviour = require("../behaviour").Behaviour;
var CstyleBehaviour = require("./cstyle").CstyleBehaviour;
var TokenIterator = require("../../token_iterator").TokenIterator;

function hasType(token, type) {
    var hasType = true;
    var typeList = token.type.split('.');
    var needleList = type.split('.');
    needleList.forEach(function(needle){
        if (typeList.indexOf(needle) == -1) {
            hasType = false;
            return false;
        }
    });
    return hasType;
}

var XmlBehaviour = function () {
    
    this.inherit(CstyleBehaviour, ["string_dquotes"]); // Get string behaviour
    
    this.add("autoclosing", "insertion", function (state, action, editor, session, text) {
        if (text == '>') {
            var position = editor.getCursorPosition();
            var iterator = new TokenIterator(session, position.row, position.column);
            var token = iterator.getCurrentToken();
            var atCursor = false;
            if (!token || !hasType(token, 'meta.tag') && !(hasType(token, 'text') && token.value.match('/'))){
                do {
                    token = iterator.stepBackward();
                } while (token && (hasType(token, 'string') || hasType(token, 'keyword.operator') || hasType(token, 'entity.attribute-name') || hasType(token, 'text')));
            } else {
                atCursor = true;
            }
            if (!token || !hasType(token, 'meta.tag-name') || iterator.stepBackward().value.match('/')) {
                return
            }
            var tag = token.value;
            if (atCursor){
                var tag = tag.substring(0, position.column - token.start);
            }

            return {
               text: '>' + '</' + tag + '>',
               selection: [1, 1]
            }
        }
    });

    this.add('autoindent', 'insertion', function (state, action, editor, session, text) {
        if (text == "\n") {
            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            var rightChars = line.substring(cursor.column, cursor.column + 2);
            if (rightChars == '</') {
                var indent = this.$getIndent(session.doc.getLine(cursor.row)) + session.getTabString();
                var next_indent = this.$getIndent(session.doc.getLine(cursor.row));

                return {
                    text: '\n' + indent + '\n' + next_indent,
                    selection: [1, indent.length, 1, indent.length]
                }
            }
        }
    });
    
}
oop.inherits(XmlBehaviour, Behaviour);

exports.XmlBehaviour = XmlBehaviour;
});

define('ace/mode/folding/cstyle', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/range', 'ace/mode/folding/fold_mode'], function(require, exports, module) {


var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function() {};
oop.inherits(FoldMode, BaseFoldMode);

(function() {

    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var line = session.getLine(row);
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i + match[0].length, 1);
        }

        if (foldStyle !== "markbeginend")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };

}).call(FoldMode.prototype);

});