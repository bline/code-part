/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */


%start file

%%

file
  : CodeOrComments EOF
    {{ return yy.collector.final(); }}
  ;

CodeOrComments
  : CodeOrComment
  | CodeOrComments CodeOrComment
  ;

CodeOrComment
  : Comment
  | Code
  ;
  
Comment
  : SingleComment
  | MultiComment
  ;
  
Code
  : CODE
    { yy.collector.addCode($1); }
  ;
  
SingleComment
  : LINE_COMMENT
    { yy.collector.addComment($1); }
  ;

MultiComment
  : MULTI_COMMENT
    { yy.collector.addComment($1, true); }
  ;
