
export interface PanelProps {
  children: React.ReactNode;
}

export const Panel: React.FunctionComponent<PanelProps> = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
}

