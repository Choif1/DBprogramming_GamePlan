import axios from 'axios';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn, setCurrentUser } = useOutletContext();
  const [form, setForm] = useState({ username: '', nickname: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await axios.post('/api/users/signup', {
        username: form.username.trim(),
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      localStorage.setItem('gameplan_token', data.token);
      localStorage.setItem('gameplan_user', JSON.stringify(data.user));
      setIsLoggedIn(true);
      setCurrentUser(data.user);
      navigate(location.state?.from?.pathname || location.state?.redirectTo || '/projects');
    } catch (requestError) {
      setError(requestError.response?.data?.message || '회원가입에 실패했습니다. 서버 연결을 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <AuthCard>
        <Eyebrow>GAMEPLAN ACCOUNT</Eyebrow>
        <Title>회원가입</Title>
        <Description>GamePlan에서 게임 기획을 나누고 발전시켜 보세요.</Description>
        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="username">아이디</Label>
            <Input id="username" name="username" value={form.username} onChange={updateField} autoComplete="username" maxLength={50} required />
          </Field>
          <Field>
            <Label htmlFor="nickname">닉네임</Label>
            <Input id="nickname" name="nickname" value={form.nickname} onChange={updateField} autoComplete="nickname" maxLength={30} required />
          </Field>
          <Field>
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" maxLength={100} required />
          </Field>
          <Field>
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" minLength={8} required />
            <Hint>8자 이상 입력해 주세요.</Hint>
          </Field>
          <Field>
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" minLength={8} required />
          </Field>
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
          <SubmitButton type="submit" disabled={isSubmitting}>{isSubmitting ? '가입 중...' : '회원가입'}</SubmitButton>
        </Form>
        <FooterText>이미 계정이 있나요? <FooterLink to="/login" state={location.state}>로그인</FooterLink></FooterText>
      </AuthCard>
    </Page>
  );
};

export default Signup;

const Page = styled.div`
  flex: 1;
  width: 100%;
  padding: 64px 20px 80px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #fafafa;
  color: rgb(50, 50, 50);
  @media (max-width: 520px) { padding: 38px 16px 56px; }
`;

const AuthCard = styled.div`
  width: min(100%, 460px);
  padding: 38px 42px 34px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .035);
  @media (max-width: 520px) { padding: 30px 22px 26px; }
`;

const Eyebrow = styled.div`
  color: #777;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
`;

const Title = styled.h1`
  margin-top: 13px;
  color: rgb(50, 50, 50);
  font-size: 29px;
  font-weight: 800;
  letter-spacing: -1px;
`;

const Description = styled.p`
  margin-top: 8px;
  color: #777;
  font-size: 12px;
  line-height: 1.7;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 17px;
  margin-top: 28px;
`;

const Field = styled.div`display: flex; flex-direction: column; gap: 7px;`;

const Label = styled.label`
  color: #444;
  font-size: 12px;
  font-weight: 700;
`;

const Input = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 11px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  background: #fff;
  color: rgb(50, 50, 50);
  font: inherit;
  font-size: 13px;
  &:focus { border-color: #666; box-shadow: 0 0 0 2px rgba(0, 0, 0, .06); }
`;

const Hint = styled.span`color: #888; font-size: 10px;`;

const ErrorMessage = styled.p`
  margin: -3px 0;
  color: #555;
  font-size: 12px;
  line-height: 1.6;
`;

const SubmitButton = styled.button`
  height: 44px;
  margin-top: 3px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 4px;
  background: rgb(50, 50, 50);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  &:disabled { cursor: wait; opacity: .65; }
`;

const FooterText = styled.p`
  margin-top: 22px;
  color: #777;
  font-size: 11px;
  text-align: center;
`;

const FooterLink = styled(Link)`
  margin-left: 5px;
  color: rgb(50, 50, 50);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
`;
