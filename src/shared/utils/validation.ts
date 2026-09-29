import type { Rule } from 'antd/es/form';

export const PHONE_RE = /^\+998\d{9}$/;
export const PROJECT_KEY_RE = /^[A-Z]{2,6}$/;

export const rules = {
  required: (label = 'This field'): Rule => ({ required: true, message: `${label} is required` }),
  email: { type: 'email', message: 'Enter a valid email' } satisfies Rule,
  phone: {
    validator: (_: unknown, v: string | undefined) =>
      !v || PHONE_RE.test(v.replace(/\s/g, ''))
        ? Promise.resolve()
        : Promise.reject(new Error('Format: +998 XX XXX XX XX')),
  } satisfies Rule,
  projectKey: { pattern: PROJECT_KEY_RE, message: '2–6 uppercase Latin letters' } satisfies Rule,
  min: (n: number): Rule => ({ min: n, message: `At least ${n} characters` }),
  max: (n: number): Rule => ({ max: n, message: `Maximum ${n} characters` }),
};

/** "+998901112233" → "+998 90 111 22 33" */
export const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '');
  if (d.length !== 12) return v;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
};
