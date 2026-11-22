import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Loading from '../components/ui/Loading';

const EMPTY_PROFILE_FORM = {
  name: '',
  phone: '',
  companyName: '',
  companyEmail: '',
  companyPhone: '',
};

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function Profile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get('/profile')
      .then(({ data }) => {
        setProfile(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          companyPhone: data.companyPhone || '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handlePasswordChange = (event) => {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavingProfile(true);

    const payload = { name: form.name, phone: form.phone };
    if (profile.role === 'advertiser') {
      Object.assign(payload, {
        companyName: form.companyName,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone,
      });
    }

    try {
      const { data } = await api.put('/profile', payload);
      setProfile(data);
      updateUser(data);
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        companyName: data.companyName || '',
        companyEmail: data.companyEmail || '',
        companyPhone: data.companyPhone || '',
      });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const { data } = await api.put('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(data.message);
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your contact details and account password." />

      {loading ? (
        <Loading label="Loading profile..." />
      ) : (
        <div className="flex max-w-3xl flex-col gap-6">
          {error && <Alert>{error}</Alert>}
          {success && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}

          {profile && (
            <Card title="Contact details">
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                <Input label="Full name" name="name" value={form.name} onChange={handleProfileChange} required />
                <Input label="Account email (cannot be changed)" type="email" value={profile.email || ''} readOnly />
                <Input label="Mobile number" type="tel" name="phone" value={form.phone} onChange={handleProfileChange} required />

                {profile.role === 'advertiser' && (
                  <>
                    <Input label="Company name" name="companyName" value={form.companyName} onChange={handleProfileChange} required />
                    <Input
                      label="Company email"
                      type="email"
                      name="companyEmail"
                      value={form.companyEmail}
                      onChange={handleProfileChange}
                      readOnly={Boolean(profile.companyEmail)}
                      required
                    />
                    <Input label="Company phone" type="tel" name="companyPhone" value={form.companyPhone} onChange={handleProfileChange} required />
                  </>
                )}

                <div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Change password">
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <Input
                label="Current password"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
              <Input
                label="New password"
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                required
              />
              {passwordError && <Alert>{passwordError}</Alert>}
              {passwordSuccess && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{passwordSuccess}</p>}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Change password'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
