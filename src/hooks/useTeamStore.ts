import { useState, useEffect } from 'react';

export interface TeamPokemon {
  pokemonId: number;
  moves: string[];
  item?: string;
}

export interface Team {
  id: string;
  name: string;
  pokemons: TeamPokemon[];
  isPublic?: boolean;
}

export interface User {
  username: string;
}

export function useTeamStore() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('prokedex_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      const storedTeams = localStorage.getItem(`prokedex_teams_${JSON.parse(storedUser).username}`);
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
      }
    }
  }, []);

  const login = (username: string) => {
    const newUser = { username };
    setUser(newUser);
    localStorage.setItem('prokedex_user', JSON.stringify(newUser));
    const storedTeams = localStorage.getItem(`prokedex_teams_${username}`);
    if (storedTeams) {
      setTeams(JSON.parse(storedTeams));
    } else {
      setTeams([]);
    }
  };

  const logout = () => {
    setUser(null);
    setTeams([]);
    localStorage.removeItem('prokedex_user');
  };

  const saveTeam = (team: Team) => {
    if (!user) return;
    const newTeams = [...teams.filter(t => t.id !== team.id), team];
    setTeams(newTeams);
    localStorage.setItem(`prokedex_teams_${user.username}`, JSON.stringify(newTeams));
  };

  const deleteTeam = (id: string) => {
    if (!user) return;
    const newTeams = teams.filter(t => t.id !== id);
    setTeams(newTeams);
    localStorage.setItem(`prokedex_teams_${user.username}`, JSON.stringify(newTeams));
  };

  const importTeams = (importedTeams: Team[]) => {
    if (!user) return;
    // Merge teams, avoiding duplicate IDs
    const existingIds = new Set(teams.map(t => t.id));
    const uniqueImported = importedTeams.filter(t => !existingIds.has(t.id));
    const newTeams = [...teams, ...uniqueImported];
    setTeams(newTeams);
    localStorage.setItem(`prokedex_teams_${user.username}`, JSON.stringify(newTeams));
  };

  return { user, teams, login, logout, saveTeam, deleteTeam, importTeams };
}
