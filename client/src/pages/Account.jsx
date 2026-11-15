import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

const Account = () => {
  const { setIsLoggedIn, currentUser, setCurrentUser } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: currentUser?.username || '',
    nickname: currentUser?.nickname || '',
    email: currentUser?.email || '',
    currentPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    axios.get('/api/users/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
    })
      .then(({ data }) => {
        if (!isCurrent) return;
        setCurrentUser(data);
        localStorage.setItem('gameplan_user', JSON.stringify(data));
        setForm((current) => ({
          ...current,
          username: data.username || '',
          nickname: data.nickname || '',
          email: data.email || '',
        }));
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(requestError.response?.data?.message || '계정 정보를 불러오지 못했습니다.');
        if (requestError.response?.status === 401) {
          localStorage.removeItem('gameplan_token');
          localStorage.removeItem('gameplan_user');
          setIsLoggedIn(false);
          setCurrentUser(null);
          navigate('/login', { replace: true });
        }
      });
    return () => { isCurrent = false; };
  }, [navigate, setCurrentUser, setIsLoggedIn]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      await axios.put('/api/users/me', {
        username: form.username.trim(),
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        currentPassword: form.currentPassword,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
      });
      const { data } = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
      });
      setCurrentUser(data);
      localStorage.setItem('gameplan_user', JSON.stringify(data));
      setForm((current) => ({ ...current, currentPassword: '' }));
      setMessage('계정 정보가 수정되었습니다.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || '계정 정보를 수정하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.currentPassword) {
      setError('탈퇴하려면 현재 비밀번호를 먼저 입력해 주세요.');
      return;
    }
    if (!window.confirm('정말 탈퇴할까요? 작성한 기획서도 함께 삭제됩니다.')) return;

    setIsDeleting(true);
    setMessage('');
    setError('');
    try {
      await axios.delete('/api/users/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
        data: { password: form.currentPassword },
      });
      localStorage.removeItem('gameplan_token');
      localStorage.removeItem('gameplan_user');
      setIsLoggedIn(false);
      setCurrentUser(null);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || '회원 탈퇴를 완료하지 못했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Page>
      <Card>
        <Eyebrow>ACCOUNT SETTINGS</Eyebrow>
        <Title>내 정보</Title>
        <Description>계정 정보를 확인하고 수정할 수 있어요.</Description>
        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="username">아이디</Label>
            <Input id="username" name="username" value={form.username} onChange={updateField} maxLength={50} required />
          </Field>
          <Field>
            <Label htmlFor="nickname">닉네임</Label>
            <Input id="nickname" name="nickname" value={form.nickname} onChange={updateField} maxLength={30} required />
          </Field>
          <Field>
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={updateField} maxLength={100} required />
          </Field>
          <Field>
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input id="currentPassword" name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} autoComplete="current-password" required />
            <Hint>정보 수정과 회원 탈퇴 시 본인 확인에 사용합니다.</Hint>
          </Field>
          {message && <StatusMessage role="status">{message}</StatusMessage>}
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
          <SaveButton type="submit" disabled={isSaving || isDeleting}>{isSaving ? '저장 중...' : '정보 수정'}</SaveButton>
        </Form>
        <DangerZone>
          <DangerHeading>회원 탈퇴</DangerHeading>
          <DangerCopy>탈퇴하면 작성한 기획서도 함께 삭제됩니다.</DangerCopy>
          <DeleteButton type="button" onClick={handleDelete} disabled={isSaving || isDeleting}>
            {isDeleting ? '탈퇴 처리 중...' : '계정 삭제'}
          </DeleteButton>
        </DangerZone>
      </Card>
    </Page>
  );
};

export default Account;

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

const Card = styled.section`
  width: min(100%, 560px);
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

const StatusMessage = styled.p`color: #555; font-size: 12px;`;
const ErrorMessage = styled.p`color: #555; font-size: 12px; line-height: 1.6;`;

const SaveButton = styled.button`
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

const DangerZone = styled.section`
  margin-top: 32px;
  padding-top: 22px;
  border-top: 1px solid #e7e7e7;
`;

const DangerHeading = styled.h2`color: #444; font-size: 13px; font-weight: 700;`;
const DangerCopy = styled.p`margin-top: 7px; color: #888; font-size: 11px; line-height: 1.6;`;

const DeleteButton = styled.button`
  margin-top: 14px;
  padding: 9px 12px;
  border: 1px solid #b8b8b8;
  border-radius: 4px;
  background: #fff;
  color: #555;
  font: inherit;
  font-size: 11px;
  &:hover { border-color: #666; color: #222; }
  &:disabled { cursor: wait; opacity: .65; }
`;
