import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Footer from './components/Footer';

const Layout = () => {
  return (
    <PageWrapper>
        <Header />
        <MainContent>
            <Outlet />
        </MainContent>
        <Footer />
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); /* 모바일 뷰 구분용 연한 그림자 */
`;

const MainContent = styled.main`
  flex: 1; /* 콘텐츠 영역이 남은 높이를 채워 푸터가 하단에 붙도록 함 */
  display: flex;
  flex-direction: column;
`;

export default Layout;