// A small loader service that is usable outside React (axios interceptors)
// and emits window events so a React LoadingContext can react to it.

let count = 0;

function emit() {
  window.dispatchEvent(new CustomEvent('app-loader', { detail: { count } }));
}

export function showLoader() {
  count += 1;
  emit();
}

export function hideLoader() {
  count = Math.max(0, count - 1);
  emit();
}

export function resetLoader() {
  count = 0;
  emit();
}

export function getCount() {
  return count;
}
