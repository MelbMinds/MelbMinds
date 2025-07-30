"use client";

import React, { useEffect, useState } from 'react';

interface Group {
  id: number;
  name: string;
}

const DashboardPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No token found');
        return;
      }

      try {
        const response = await fetch('https://melbminds-production.up.railway.app/api/groups/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data: Group[] = await response.json();
        setGroups(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    };

    fetchGroups();
  }, []);

  const handleDelete = async (groupId: number) => {
    const token = localStorage.getItem('access_token');
    console.log(`[Dashboard] Attempting to delete group: ${groupId} Token: ${token}`);
    if (!token) {
      setError('No token found');
      return;
    }

    try {
      const response = await fetch(`https://melbminds-production.up.railway.app/api/groups/${groupId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null); // Try to get error detail
        const errorMessage = errorData?.detail || `Failed to delete group. Status: ${response.status}`;
        throw new Error(errorMessage);
      }

      setGroups(groups.filter(group => group.id !== groupId));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <ul>
        {groups.map(group => (
          <li key={group.id}>
            {group.name}
            <button onClick={() => handleDelete(group.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;