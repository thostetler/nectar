import { describe, it, expect } from 'vitest';
import { useSolrError, SOLR_ERROR } from '../useSolrError';
import { AxiosError } from 'axios';

describe('useSolrError', () => {
  describe('Solr error responses', () => {
    it('should parse undefined field error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'undefined field bibcode',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.FIELD_NOT_FOUND);
      expect(result.field).toBe('bibcode');
      expect(result.originalMsg).toBe('undefined field bibcode');
    });

    it('should parse undefined field error with quotes', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'undefined field "author"',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.FIELD_NOT_FOUND);
      expect(result.field).toBe('author');
    });

    it('should parse sort field not found error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: "sort param field can't be found",
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.SORT_FIELD_NOT_FOUND);
      expect(result.field).toBeUndefined(); // pickField doesn't extract from this message format
    });

    it('should parse cannot sort on multivalued field error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'cannot sort on a multi-valued field',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.CANNOT_SORT_MULTIVALUED);
      expect(result.field).toBeUndefined();
    });

    it('should parse docvalues required error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: "can't sort on a field w/o docvalues",
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.DOCVALUES_REQUIRED_FOR_SORT);
    });

    it('should parse bad query syntax error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'syntax error: cannot parse query',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.BAD_QUERY_SYNTAX);
    });

    it('should parse leading wildcard not allowed error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'LEADING_WILDCARD_NOT_ALLOWED',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.BAD_QUERY_SYNTAX);
    });

    it('should parse bad range syntax error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: "expected 'TO' in range query",
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.BAD_RANGE_SYNTAX);
    });

    it('should parse too many boolean clauses error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'too many boolean clauses',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.TOO_MANY_BOOLEAN_CLAUSES);
    });

    it('should parse local params syntax error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'local params must end with }',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.LOCAL_PARAMS_SYNTAX);
    });

    it('should parse unknown query parser error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'unknown query parser: invalid',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN_QUERY_PARSER);
    });

    it('should parse undefined function error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'undefined function: invalid_func',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.UNDEFINED_FUNCTION);
    });

    it('should parse invalid date error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'invalid date string',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.INVALID_DATE);
    });

    it('should parse invalid number error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: "can't parse int value",
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.INVALID_NUMBER);
    });

    it('should parse invalid boolean error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'invalid boolean value',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.INVALID_BOOLEAN);
    });

    it('should parse missing param error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'missing parameter: q',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.PARAM_OUT_OF_RANGE_OR_MISSING);
    });

    it('should parse version conflict error', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'version conflict detected',
              code: 409,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.VERSION_CONFLICT);
    });

    it('should detect syntax error from metadata', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'Query failed',
              code: 400,
              metadata: ['org.apache.solr.search.SyntaxError: Cannot parse query'],
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.BAD_QUERY_SYNTAX);
    });
  });

  describe('HTTP status code mapping', () => {
    it('should map 401 to UNAUTHORIZED', () => {
      const error = {
        response: {
          status: 401,
          data: { error: { msg: 'Unauthorized', code: 401 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.UNAUTHORIZED);
    });

    it('should map 403 to FORBIDDEN', () => {
      const error = {
        response: {
          status: 403,
          data: { error: { msg: 'Forbidden', code: 403 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.FORBIDDEN);
    });

    it('should map 404 to NOT_FOUND', () => {
      const error = {
        response: {
          status: 404,
          data: { error: { msg: 'Not found', code: 404 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.NOT_FOUND);
    });

    it('should map 409 to CONFLICT', () => {
      const error = {
        response: {
          status: 409,
          data: { error: { msg: 'Conflict', code: 409 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.CONFLICT);
    });

    it('should map 500 to SERVER_ERROR', () => {
      const error = {
        response: {
          status: 500,
          data: { error: { msg: 'Server error', code: 500 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.SERVER_ERROR);
    });

    it('should map 503 to SERVICE_UNAVAILABLE', () => {
      const error = {
        response: {
          status: 503,
          data: { error: { msg: 'Service unavailable', code: 503 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.SERVICE_UNAVAILABLE);
    });

    it('should fallback to HTTP code when no pattern matches', () => {
      const error = {
        response: {
          status: 404,
          data: { error: { msg: 'Unknown error message', code: 404 } },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.NOT_FOUND);
    });
  });

  describe('non-Axios errors', () => {
    it('should return UNKNOWN for non-Axios error', () => {
      const error = new Error('Generic error');

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN);
      expect(result.originalMsg).toBe('Unknown error');
    });

    it('should return UNKNOWN for invalid error shape', () => {
      const error = {
        response: {
          data: {
            someField: 'value',
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN);
    });

    it('should handle null error', () => {
      const result = useSolrError(null);
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN);
    });

    it('should handle undefined error', () => {
      const result = useSolrError(undefined);
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN);
    });

    it('should handle plain object without proper structure', () => {
      const result = useSolrError({ random: 'data' });
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN);
    });
  });

  describe('edge cases', () => {
    it('should handle Axios error without response', () => {
      const error = {
        message: 'Network Error',
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.UNKNOWN);
      expect(result.originalMsg).toBe('Network Error');
    });

    it('should handle Axios error with empty response data', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
        message: 'Server Error',
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.SERVER_ERROR);
      expect(result.originalMsg).toBe('Server Error');
    });

    it('should prioritize pattern match over HTTP code', () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: {
              msg: 'undefined field test',
              code: 500,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.FIELD_NOT_FOUND);
      expect(result.field).toBe('test');
    });

    it('should handle case-insensitive pattern matching', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'UNDEFINED FIELD TestField',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.error).toBe(SOLR_ERROR.FIELD_NOT_FOUND);
      expect(result.field).toBe('TestField');
    });

    it('should handle multiple pattern possibilities with first match', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'cannot parse query: too many boolean clauses',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      // Should match first pattern (BAD_QUERY_SYNTAX comes before TOO_MANY_BOOLEAN_CLAUSES in PATTERNS array)
      expect(result.error).toBe(SOLR_ERROR.BAD_QUERY_SYNTAX);
    });

    it('should strip quotes from field names', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: 'undefined field "my_field"',
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.field).toBe('my_field');
    });

    it('should strip single quotes from field names', () => {
      const error = {
        response: {
          data: {
            error: {
              msg: "undefined field 'my_field'",
              code: 400,
            },
          },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = useSolrError(error);
      expect(result.field).toBe('my_field');
    });
  });
});
