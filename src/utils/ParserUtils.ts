'use strict';

import * as _ from 'lodash';
import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import AbstractSyntaxTreeNode from '../AbstractSyntaxTreeNode';

/**
 * Utility class for parsing and generating code.
 * @constructor
 */
export default class ParserUtils {
  private esprimaOptions = {
    comment: true,
    loc: true,
    range: true,
    tokens: true,
  };

  private escodegenOptions: escodegen.GenerateOptions = {
    comment: true,
    format: {
      preserveBlankLines: true
    }
  };

  /**
   * Parses code to generate an Abstract Syntax Tree.
   * @function
   * @param code - The code which has to be parsed.
   * @returns {Object} The generated Abstract Syntax Tree.
   */
  public parse (code: string): any {
    if (code === '') {
      return {};
    }

    this.escodegenOptions.sourceCode = code;
    var abstractSyntaxTree = esprima.parse(code, this.esprimaOptions);
    //Attaching the comments is needed to keep the comments and to allow blank lines to be preserved.
    abstractSyntaxTree = escodegen.attachComments(abstractSyntaxTree, abstractSyntaxTree.comments, abstractSyntaxTree.tokens);

    return abstractSyntaxTree;
  };

  /**
   * Finds all nodes which have one of several types in a syntax tree.
   * @function
   * @param abstractSyntaxTree - The current part of the abstract syntax tree which will be investigated.
   * @param  types - The list of types which are requested.
   * @returns  All nodes which have one of the requested types.
   */
  public getNodesWithType (abstractSyntaxTree: any, types: string[], nodes?: AbstractSyntaxTreeNode[], parent?: AbstractSyntaxTreeNode, key?: string): AbstractSyntaxTreeNode[] {
    nodes = nodes || [];

    if (abstractSyntaxTree instanceof Object && !(abstractSyntaxTree instanceof Array) && _.indexOf(types, abstractSyntaxTree.type) >= 0) {
      nodes.push(new AbstractSyntaxTreeNode(abstractSyntaxTree, parent, key));
    }

    _.forOwn(abstractSyntaxTree, (childNode, key) => {
      if (childNode instanceof Object && !(childNode instanceof Array)) {
        this.getNodesWithType(childNode, types, nodes, abstractSyntaxTree, key);
      } else if (childNode instanceof Array) {
        _.forEach(childNode, (arrayChild, index) => {
          if (arrayChild instanceof Object && !(arrayChild instanceof Array)) {
            this.getNodesWithType(arrayChild, types, nodes, childNode, index);
          }
        });
      }
    });

    return nodes;
  };


  /**
   * Parses an Abstract Syntax Tree to generate code.
   * @function
   * @param {Object} ast - The Abstract Syntax Tree.
   * @param orignalCode - The original code of the ast.
   * @returns The generated code.
   */
  public generate (ast: ESTree.Node, originalCode?: string): string {
    this.escodegenOptions.sourceCode = originalCode || this.escodegenOptions.sourceCode;

    return escodegen.generate(ast, this.escodegenOptions);
  };

}