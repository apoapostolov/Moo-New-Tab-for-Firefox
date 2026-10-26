const WidgetsLayout = ({ children, split = false }) => {
  return (
    <div id="widgets" className={split ? 'widgetsSplit' : undefined}>
      {children}
    </div>
  );
};

export { WidgetsLayout as default, WidgetsLayout };
