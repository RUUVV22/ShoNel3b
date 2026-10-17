import { useCallback, useEffect, useRef, useState } from 'react';

// Ephemeral input drafts are local; the server remains authoritative for gameplay.
// Declare the defaults object outside of the calling component.
export function useRoundInputs(defaults, scopeKey) {
  const [values, setValues] = useState(() => ({ ...defaults }));
  const revision = useRef(0);
  const currentScope = useRef(scopeKey);

  const reset = useCallback(() => {
    revision.current += 1;
    setValues({ ...defaults });
  }, [defaults]);

  const setField = useCallback((field, value) => {
    revision.current += 1;
    setValues(previous => ({ ...previous, [field]: value }));
  }, []);

  // Reset only at genuine lifecycle boundaries, never at each multiplayer update.
  useEffect(() => {
    if (currentScope.current !== scopeKey) {
      currentScope.current = scopeKey;
      reset();
    }
  }, [reset, scopeKey]);

  const submitAndReset = useCallback(async submit => {
    const submittedRevision = revision.current;
    const submittedScope = currentScope.current;
    const response = await submit();
    if (response?.ok && submittedRevision === revision.current && submittedScope === currentScope.current) {
      reset();
    }
    return response;
  }, [reset]);

  return { values, setField, reset, submitAndReset };
}
