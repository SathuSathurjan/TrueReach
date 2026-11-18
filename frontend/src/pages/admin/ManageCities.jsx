import { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function ManageCities() {
  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingCityId, setEditingCityId] = useState(null);
  const [editCityName, setEditCityName] = useState('');
  const [savingCityId, setSavingCityId] = useState(null);
  const [deletingCityId, setDeletingCityId] = useState(null);

  const loadData = async () => {
    try {
      const [cityRes, managerRes] = await Promise.all([
        api.get('/cities'),
        api.get('/users', { params: { role: 'citymanager' } }),
      ]);
      setCities(cityRes.data);
      setManagers(managerRes.data);
      setListError('');
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    const cityName = name.trim();
    if (!cityName) {
      setFormError('City name is required');
      return;
    }
    if (cities.some((city) => city.name.trim().toLowerCase() === cityName.toLowerCase())) {
      setFormError('City already exists');
      return;
    }

    setCreating(true);
    try {
      await api.post('/cities', { name: cityName });
      setName('');
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create city');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignManager = async (cityId, managerId) => {
    try {
      await api.put(`/cities/${cityId}`, { cityManager: managerId || null });
      loadData();
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to assign manager');
    }
  };

  const handleStatusToggle = async (city) => {
    const newStatus = city.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/cities/${city._id}`, { status: newStatus });
      loadData();
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSaveCityName = async (city) => {
    const cityName = editCityName.trim();
    setListError('');
    if (!cityName) {
      setListError('City name is required');
      return;
    }
    if (cities.some((item) => item._id !== city._id && item.name.trim().toLowerCase() === cityName.toLowerCase())) {
      setListError('City already exists');
      return;
    }

    setSavingCityId(city._id);
    try {
      await api.put(`/cities/${city._id}`, { name: cityName });
      setEditingCityId(null);
      setEditCityName('');
      await loadData();
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to update city');
    } finally {
      setSavingCityId(null);
    }
  };

  const handleDeleteCity = async (city) => {
    if (!window.confirm(`Remove "${city.name}"? This action cannot be undone.`)) return;

    setListError('');
    setDeletingCityId(city._id);
    try {
      await api.delete(`/cities/${city._id}`);
      if (editingCityId === city._id) {
        setEditingCityId(null);
        setEditCityName('');
      }
      await loadData();
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to remove city');
    } finally {
      setDeletingCityId(null);
    }
  };

  const managerOptions = [
    { value: '', label: '— Unassigned —' },
    ...managers
      .filter((manager) => manager.isApproved !== false && manager.isActive !== false)
      .map((manager) => ({ value: manager._id, label: manager.name })),
  ];

  const columns = [
    {
      key: 'name',
      label: 'City',
      render: (row) => editingCityId === row._id ? (
        <input
          aria-label={`Edit ${row.name} name`}
          value={editCityName}
          onChange={(e) => setEditCityName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveCityName(row)}
          className="w-full rounded-lg border border-border px-2 py-1 outline-none focus:border-signal"
          autoFocus
        />
      ) : row.name,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'manager',
      label: 'City Manager',
      sortValue: (row) => row.cityManager?.name || '',
      searchValue: (row) => row.cityManager?.name || '',
      render: (row) => (
        <Select
          value={row.cityManager?._id || ''}
          options={managerOptions}
          onChange={(e) => handleAssignManager(row._id, e.target.value)}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {editingCityId === row._id ? (
            <>
              <Button size="sm" className="w-24 justify-center" onClick={() => handleSaveCityName(row)} disabled={savingCityId === row._id}>
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-24 justify-center"
                onClick={() => { setEditingCityId(null); setEditCityName(''); }}
                disabled={savingCityId === row._id}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="w-24 justify-center"
              onClick={() => { setEditingCityId(row._id); setEditCityName(row.name); setListError(''); }}
            >
              Edit
            </Button>
          )}
          <Button variant="secondary" size="sm" className="w-24 justify-center" onClick={() => handleStatusToggle(row)}>
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="w-24 justify-center"
            onClick={() => handleDeleteCity(row)}
            disabled={deletingCityId === row._id}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Cities"
        subtitle="Add cities and assign a city manager to each."
      />

      <Card title="Add a new city" className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="City name"
              placeholder="e.g. Jaffna"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-24 justify-center" disabled={creating}>Add City</Button>
        </form>
        {formError && <div className="mt-4"><Alert>{formError}</Alert></div>}
      </Card>

      {loading ? (
        <Loading label="Loading cities..." />
      ) : (
        <>
          {listError && <div className="mb-4"><Alert>{listError}</Alert></div>}
          <Table
            columns={columns}
            rows={cities}
            emptyMessage="No cities yet. Add your first city above."
          />
        </>
      )}
    </div>
  );
}
