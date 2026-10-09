// React owns the DOM. Disable Prism's automatic document mutation before core loads.
if (typeof window !== 'undefined') {
  window.Prism = { ...window.Prism, manual: true, disableWorkerMessageHandler: true };
}
