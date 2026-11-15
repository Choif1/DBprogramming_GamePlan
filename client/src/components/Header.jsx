import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';

const Header = ({ isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('gameplan_token');
    localStorage.removeItem('gameplan_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <HeaderBar>
      <HeaderInner>
        <Brand to="/" aria-label="GamePlan 홈">GamePlan<span>.</span></Brand>
        <Navigation aria-label="주 메뉴">
          <NavLink to="/projects">둘러보기</NavLink>
          {isLoggedIn ? (
            <>
              <CreateProjectLink to="/projects/new">기획서 작성</CreateProjectLink>
              <UserMenu>
                <UserButton type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
                  {currentUser?.nickname || '내 계정'}<FiChevronDown aria-hidden="true" />
                </UserButton>
                {menuOpen && (
                  <Dropdown>
                    <MenuLink to="/my-projects" onClick={() => setMenuOpen(false)}>내 기획서</MenuLink>
                    <MenuLink to="/account" onClick={() => setMenuOpen(false)}>내 정보</MenuLink>
                    <MenuButton type="button" onClick={handleLogout}>로그아웃</MenuButton>
                  </Dropdown>
                )}
              </UserMenu>
            </>
          ) : (
            <>
              <NavLink to="/login">로그인</NavLink>
              <JoinLink to="/signup">회원가입</JoinLink>
            </>
          )}
        </Navigation>
      </HeaderInner>
    </HeaderBar>
  );
};

export default Header;

const HeaderBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 2;
  width: 100%;
  border-bottom: 1px solid #ededed;
  background: #fff;
  box-shadow: 0 5px 14px rgba(0, 0, 0, .12);
`;

const HeaderInner = styled.div`
  min-height: 64px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 420px) { padding: 0 19px; }
`;

const Brand = styled(Link)`
  color: rgb(50, 50, 50);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.7px;
  white-space: nowrap;

  span { color: #777; }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 23px;

  @media (max-width: 370px) { gap: 13px; }
`;

const NavLink = styled(Link)`
  color: #555;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  &:hover { color: rgb(50, 50, 50); }
`;

const JoinLink = styled(Link)`
  padding: 11px 14px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 4px;
  color: rgb(50, 50, 50);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  &:hover { background: rgb(50, 50, 50); color: #fff; }
`;

const CreateProjectLink = styled(Link)`
  padding: 11px 14px;
  border: 1px solid #dedede;
  border-radius: 4px;
  color: #555;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  &:hover { border-color: rgb(50, 50, 50); color: rgb(50, 50, 50); }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  background: transparent;
  color: rgb(50, 50, 50);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  z-index: 4;
  min-width: 132px;
  padding: 5px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(0, 0, 0, .12);
`;

const MenuLink = styled(Link)`
  display: block;
  padding: 10px;
  border-radius: 4px;
  color: #555;
  font-size: 11px;
  &:hover { background: #f5f5f5; }
`;

const MenuButton = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  background: #fff;
  color: #555;
  font: inherit;
  font-size: 11px;
  text-align: left;
  &:hover { background: #f5f5f5; }
`;

