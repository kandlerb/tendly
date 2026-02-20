export function showAlert(title: string, message?: string): void {
  setTimeout(() => window.alert(message ? `${title}\n\n${message}` : title), 0);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  _confirmLabel = 'Delete',
): void {
  if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
}
