
import styled from "@emotion/styled"

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

const Wrapper = styled.button`
padding: 0.5em;
border-radius: 0.3em;
background-color: blue;
border: none;
font-size: 1rem;
`

export const Button: React.FunctionComponent<ButtonProps> = ({ children, onClick }) => {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}

