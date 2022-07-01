
import styled from "@emotion/styled"

const Wrapper = styled.div`
background-color: #171538;
color: white;
`;

const Title = styled.div`
padding: 0.2rem;
background-color: #383749;
font-weight: bold;
font-size: 0.7rem;
`;

export interface PanelProps {
  title?: string;
  children: React.ReactNode;
}

export function Panel({
  title = "",
  children,
}: PanelProps) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      {children}
    </Wrapper>
  );
}
