import { Link, useOutletContext } from 'react-router-dom';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { FiArrowRight, FiFileText, FiMessageSquare, FiSearch } from 'react-icons/fi';

const Home = () => {
  const { isLoggedIn } = useOutletContext();
  const signatureRef = useRef(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  const followPointer = (event) => {
    if (!signatureRef.current) return;
    const isNarrow = window.innerWidth <= 760;
    const bounds = signatureRef.current.getBoundingClientRect();
    const deltaX = event.clientX - (bounds.left + bounds.width / 2);
    const deltaY = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const movement = Math.min(isNarrow ? 5 : 8, distance);
    setGaze({ x: (deltaX / distance) * movement, y: (deltaY / distance) * movement });
  };

  return (
  <Page onMouseMove={followPointer} onMouseLeave={() => setGaze({ x: 0, y: 0 })}>
    <Hero>
      <Eyebrow>GAMEPLAN</Eyebrow>
      <Title>게임 아이디어를<br />기획서로 만들어 보세요.</Title>
      <Description>게임 기획을 정리하고, 다른 창작자와 나누는 공간</Description>
      <Actions>
        <PrimaryLink to="/projects">기획서 둘러보기 <FiArrowRight aria-hidden="true" /></PrimaryLink>
        <SecondaryLink to={isLoggedIn ? '/account' : '/signup'}>
          {isLoggedIn ? '내 정보 보기' : '회원가입'}
        </SecondaryLink>
      </Actions>
      <Signature
        ref={signatureRef}
        role="img"
        aria-label="마우스를 따라 움직이는 ◯_◯ 시그니처"
      >
        <Eye $x={gaze.x} $y={gaze.y}>◯</Eye>
        <Mouth>_</Mouth>
        <Eye $x={gaze.x} $y={gaze.y}>◯</Eye>
      </Signature>
    </Hero>

    <FeaturesSection>
      <SectionHeading>
        <Eyebrow>WHAT YOU CAN DO</Eyebrow>
        <SectionTitle>아이디어를 나누고<br />함께 발전시켜요.</SectionTitle>
      </SectionHeading>
      <FeatureGrid>
        <Feature>
          <FeatureIcon><FiFileText aria-hidden="true" /></FeatureIcon>
          <FeatureTitle>기획서 작성과 공유</FeatureTitle>
          <FeatureCopy>게임의 개요부터 스토리와 시스템까지 정리해 나만의 기획서를 만들고 공유할 수 있어요.</FeatureCopy>
        </Feature>
        <Feature>
          <FeatureIcon><FiSearch aria-hidden="true" /></FeatureIcon>
          <FeatureTitle>다양한 기획서 탐색</FeatureTitle>
          <FeatureCopy>공개된 게임 기획서를 둘러보며 새로운 아이디어와 게임을 발견해 보세요.</FeatureCopy>
        </Feature>
        <Feature>
          <FeatureIcon><FiMessageSquare aria-hidden="true" /></FeatureIcon>
          <FeatureTitle>섹션별 피드백</FeatureTitle>
          <FeatureCopy>기획서의 각 섹션에 의견을 남기고, 받은 피드백을 항목별로 확인할 수 있어요.</FeatureCopy>
        </Feature>
      </FeatureGrid>
    </FeaturesSection>

    <SignupSection>
      <SignupEyebrow>{isLoggedIn ? 'DISCOVER MORE IDEAS' : 'START WITH YOUR IDEA'}</SignupEyebrow>
      <SignupTitle>
        {isLoggedIn ? <>다른 기획서를 둘러보고<br />새로운 영감을 얻어 보세요.</> : <>당신의 게임 기획을<br />GamePlan에서 시작해 보세요.</>}
      </SignupTitle>
      <SignupCopy>
        {isLoggedIn ? '공개된 게임 기획서에서 새로운 아이디어를 찾아보세요.' : '회원가입하고 첫 기획서를 만들어 보세요.'}
      </SignupCopy>
      <SignupLink to={isLoggedIn ? '/projects' : '/signup'}>
        {isLoggedIn ? '기획서 둘러보기' : '회원가입하기'} <FiArrowRight aria-hidden="true" />
      </SignupLink>
    </SignupSection>
  </Page>
  );
};

export default Home;

const Page = styled.div`
  flex: 1;
  width: 100%;
  color: rgb(50, 50, 50);
  background: #fff;
`;

const Hero = styled.section`
  position: relative;
  min-height: 490px;
  padding: 80px clamp(40px, 9vw, 140px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  @media (max-width: 520px) {
    min-height: 460px;
    padding: 64px 26px;
  }
`;

const Eyebrow = styled.div`
  margin-bottom: 25px;
  color: #777;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
`;

const Title = styled.h1`
  font-size: clamp(32px, 7vw, 43px);
  line-height: 1.38;
  letter-spacing: -1.8px;
  font-weight: 800;
`;

const Description = styled.p`
  margin-top: 17px;
  color: #777;
  font-size: 13px;
  line-height: 1.8;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
`;

const Signature = styled.div`
  position: absolute;
  top: 50%;
  right: clamp(54px, 13vw, 210px);
  transform: translateY(-50%);
  color: #000;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: clamp(76px, 12vw, 150px);
  font-weight: 400;
  letter-spacing: -.08em;
  line-height: 1;
  user-select: none;
  white-space: nowrap;

  @media (max-width: 760px) {
    position: relative;
    top: auto;
    right: auto;
    align-self: flex-end;
    margin-top: 18px;
    transform: none;
    font-size: 66px;
  }
`;

const Eye = styled.span`
  display: inline-block;
  color: #000;
  transform: translate(${({ $x }) => `${$x}px`}, ${({ $y }) => `${$y}px`});
  transition: transform 45ms linear;
`;

const Mouth = styled.span`
  display: inline-block;
  color: #000;
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 12px 16px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 5px;
  background: rgb(50, 50, 50);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  transition: background .15s, color .15s;

  &:hover {
    background: #fff;
    color: rgb(50, 50, 50);
  }
`;

const SecondaryLink = styled(Link)`
  padding: 8px 0;
  color: #555;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;

  &:hover { color: rgb(50, 50, 50); }
`;

const FeaturesSection = styled.section`
  position: relative;
  padding: 78px clamp(26px, 9vw, 140px) 84px;
  border-top: 1px solid #eee;
  @media (max-width: 520px) { padding: 60px 26px; }
`;

const SectionHeading = styled.div`
  margin-bottom: 32px;
  ${Eyebrow} { margin-bottom: 14px; }
`;

const SectionTitle = styled.h2`
  font-size: clamp(25px, 4vw, 34px);
  line-height: 1.45;
  letter-spacing: -1.2px;
  font-weight: 800;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  @media (max-width: 700px) { grid-template-columns: 1fr; gap: 12px; }
`;

const Feature = styled.article`
  min-height: 205px;
  padding: 25px 24px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(0, 0, 0, .035);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  &:hover, &:focus-within {
    transform: translateY(-4px);
    border-color: #d5d5d5;
    box-shadow: 0 9px 20px rgba(0, 0, 0, .09);
  }
  @media (max-width: 700px) {
    min-height: 0;
    padding: 22px;
  }
`;

const FeatureIcon = styled.div`
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border: 1px solid #d8d8d8;
  border-radius: 5px;
  color: #333;
  font-size: 16px;
`;

const FeatureTitle = styled.h3`
  margin-top: 18px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.3px;
`;

const FeatureCopy = styled.p`
  max-width: 310px;
  margin-top: 9px;
  color: #777;
  font-size: 12px;
  line-height: 1.8;
`;

const SignupSection = styled.section`
  margin: 0 0 0;
  padding: 48px clamp(26px, 9vw, 140px) 50px;
  background: rgb(50, 50, 50);
  color: #fff;
  @media (max-width: 520px) { margin: 0 0 55px; padding: 36px 26px; }
`;

const SignupEyebrow = styled.div`
  margin-bottom: 13px;
  color: #aaa;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.8px;
`;

const SignupTitle = styled.h2`
  font-size: clamp(23px, 4vw, 32px);
  line-height: 1.45;
  letter-spacing: -1px;
`;

const SignupCopy = styled.p`
  margin-top: 10px;
  color: #bbb;
  font-size: 12px;
`;

const SignupLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-top: 23px;
  padding: 11px 15px;
  background: #fff;
  color: rgb(50, 50, 50);
  font-size: 12px;
  font-weight: 700;
  transition: background .15s;
  &:hover { background: #e8e8e8; }
`;
