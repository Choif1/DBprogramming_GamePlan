import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Footer from './components/Footer';

const Layout = ({ isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser }) => {
  return (
    <PageWrapper>
        <Header
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
        <MainContent>
            <Outlet context={{ isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser }} />
        </MainContent>
        <Footer />
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
`;

const MainContent = styled.main`
  flex: 1; /* 콘텐츠 영역이 남은 높이를 채워 푸터가 하단에 붙도록 함 */
  display: flex;
  flex-direction: column;
`;

export default Layout;
