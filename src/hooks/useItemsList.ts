import { useState, useEffect } from 'react';

export interface BasicItem {
  id: string;
  name: string;
  url: string;
}

export function useItemsList() {
  const [items, setItems] = useState<BasicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('https://pokeapi.co/api/v2/item?limit=2500')
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          const itemsWithIds = data.results.map((item: any) => {
            const urlParts = item.url.split('/');
            const id = urlParts[urlParts.length - 2];
            return { ...item, id };
          });
          setItems(itemsWithIds);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { items, loading };
}
