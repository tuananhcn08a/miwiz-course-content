// Registration form links for offline courses: only Google Forms. Same rule as admin/index.html (FORM_RE).
export const FORM_RE = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)[^\s]+$/;
export const isFormUrl = (v) => typeof v === "string" && FORM_RE.test(v);
export const FORM_URL_MSG = "link form phải là Google Form (https://docs.google.com/forms/... hoặc https://forms.gle/...), không có dấu cách";
