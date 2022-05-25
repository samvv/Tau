
import { NeovimClient } from "neovim";
import { NeovimController } from "../nvim"
import { useEffect, useRef } from "react";

export interface NeovimEditorProps {
  client: NeovimClient;
}

export const NeovimEditor: React.FunctionComponent<NeovimEditorProps> = ({ client }) => {

  const elementRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<NeovimController | null>(null);

  useEffect(() => {

    const element = elementRef.current

    if (!element) {
      return;
    }

    if (!rendererRef.current) {
      rendererRef.current = new NeovimController(element, client);
    }

  }, [ client, elementRef.current ]);

  return (
    <div ref={elementRef} style={{ height: '100vh' }} />
  );

}

export default NeovimEditor;

