export default {
  edit: () => {
    return {
      navigateFileEnd() {},
      destroy() {},
      acequire() {
        return {
          setCompleters() {}
        };
      },
      setValue() {},
      setOptions() {},
      setTheme() {},
      setFontSize() {},
      setShowPrintMargin() {},
      getSession() {
        return {
          setUseWrapMode() {},
          setMode() {},
          setValue() {},
          on() {},
        };
      },
      renderer: {
        setShowGutter() {},
        setScrollMargin() {}
      },
      setBehavioursEnabled() {}
    };
  },
  acequire() {
    return {
      setCompleters() {}
    };
  },
  setCompleters() {
    return [{}];
  }
};
