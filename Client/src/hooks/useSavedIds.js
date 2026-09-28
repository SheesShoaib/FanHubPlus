import { useCallback, useEffect, useState } from "react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function useSavedIds(itemType) {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIds(null);
    api
      .get(`/bookmarks?itemType=${itemType}`)
      .then((list) => setIds(new Set(list.filter((b) => b.item).map((b) => b.item._id))))
      .catch(() => setIds(new Set()));
  }, [isAuthenticated, itemType]);

  return useCallback(
    (id) => {
      if (!isAuthenticated) return undefined;
      if (ids === null) return null;
      return ids.has(id);
    },
    [isAuthenticated, ids]
  );
}
