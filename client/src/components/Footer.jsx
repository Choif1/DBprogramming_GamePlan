import styled from 'styled-components';
import { DiGithubBadge } from 'react-icons/di';

const Footer = () => (
  <FooterBar>
    <FooterInner>
      <FooterTop>
        <Brand>GamePlan</Brand>
        <Copyright>게임 기획을 나누는 공간 · © 2026 GamePlan</Copyright>
      </FooterTop>
      <Details>
        <Detail><Label>개발</Label>Choifi<ContactLink aria-label="Choifi GitHub 프로필" href="https://github.com/Choif1" target="_blank" rel="noreferrer"><DiGithubBadge /></ContactLink></Detail>
        <Detail><Label>DB</Label>MySQL 8.0</Detail>
        <Detail><Label>Tech Stack</Label>React &amp; Node.js</Detail>
        <Detail><Label>문의</Label><ContactLink href="mailto:25s097@sunrint.hs.kr">25s097@sunrint.hs.kr</ContactLink></Detail>
      </Details>
    </FooterInner>
  </FooterBar>
);

export default Footer;

const FooterBar = styled.footer`
  width: 100%;
  border-top: 1px solid #ededed;
  background: #fff;
`;

const FooterInner = styled.div`
  padding: 25px 30px;
  display: flex;
  flex-direction: column;
  gap: 13px;

  @media (max-width: 420px) {
    padding: 20px 19px;
  }
`;

const FooterTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  @media (max-width: 420px) { align-items: flex-start; flex-direction: column; }
`;

const Brand = styled.span`
  color: #333;
  font-size: 16px;
  font-weight: 800;
`;

const Copyright = styled.span`
  color: #888;
  font-size: 12px;
`;

const Details = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 28px;
`;

const Detail = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #555;
  font-size: 14px;
`;

const Label = styled.strong`
  color: #888;
  font-size: 12px;
  font-weight: 600;
`;

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: inherit;
  svg { width: 25px; height: 25px; }
  &:hover { color: rgb(50, 50, 50); text-decoration: underline; text-underline-offset: 2px; }
`;
