import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Alert from '../../components/ui/Alert';
import Loading from '../../components/ui/Loading';

export default function BrowseBoards() {
  const [boards, setBoards] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/boards')
      .then((res) => setBoards(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load boards'))
      .finally(() => setLoading(false));
  }, []);

  const visibleBoards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.location || '').toLowerCase().includes(q) ||
        (b.city?.name || '').toLowerCase().includes(q)
    );
  }, [boards, query]);

  const columns = [
    { key: 'name', label: 'Board' },
    { key: 'location', label: 'Location' },
    { key: 'city', label: 'City', render: (row) => row.city?.name || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/advertiser/board/${row._id}`}>
          <Button size="sm">View Available Slots</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Browse Boards"
        subtitle="Find a billboard location for your campaign."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading boards..." />
      ) : (
        <>
          <div className="mb-4 flex w-full sm:w-72">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search boards by name, location, or city..."
            />
          </div>
          <Table
            columns={columns}
            rows={visibleBoards}
            emptyMessage={query ? 'No boards match your search.' : 'No active boards available right now.'}
          />
        </>
      )}
    </div>
  );
}
