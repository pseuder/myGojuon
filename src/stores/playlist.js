// stores/playlist.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@/composables/useApi.js";

export const usePlaylistStore = defineStore("playlist", () => {
  const MYAPI = useApi();

  // --- State ---
  // 我的最愛
  const favorites = ref([]);
  const favoritePlaylistId = ref(null);

  // 自訂播放清單
  const customPlaylists = ref([]);

  // 是否已從後端初始化完畢
  const isInitialized = ref(false);

  // 載入中
  const isFetching = ref(false);

  // --- 初始化 ---

  /** 從後端載入所有清單與最愛（頁面 onMounted 呼叫） */
  const fetchPlaylists = async () => {
    isFetching.value = true;
    try {
      const res = await MYAPI.get("/get_user_all_playlists");
      if (res.status === "success") {
        favorites.value = res.data.find(
          (item) => item.name === "My Favorite",
        ).songs;
        favoritePlaylistId.value = res.data.find(
          (item) => item.name === "My Favorite",
        ).playlist_id;
        customPlaylists.value = res.data ?? [];
        isInitialized.value = true;
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
    isFetching.value = false;
  };

  const addSongToPlaylist = async (playlist_id, source_id) => {
    const result = await MYAPI.post("/add_song_to_playlist", {
      playlist_id: playlist_id,
      source_id: source_id,
    });
    return result;
  };

  const removePlaylistSong = async (playlist_id, source_id) => {
    const result = await MYAPI.post("/remove_song_from_playlist", {
      playlist_id: playlist_id,
      source_id: source_id,
    });
    return result;
  };

  // --- 我的最愛 ---

  /** 查詢是否在最愛（同步，直接讀 local state） */
  const isFavorite = (sourceId) => {
    return favorites.value.some((v) => v.source_id === sourceId);
  };

  const toggleFavorite = (source_id) => {
    if (isFavorite(source_id)) {
      return removeFavorite(source_id);
    } else {
      return addFavorite(source_id);
    }
  };

  const addFavorite = async (source_id) => {
    let result = await addSongToPlaylist(favoritePlaylistId.value, source_id);
    favorites.value = result.data[0].songs;
    return {
      status: result.status,
      message: result.message,
    };
  };

  const removeFavorite = async (source_id) => {
    let result = await removePlaylistSong(favoritePlaylistId.value, source_id);
    favorites.value = result.data[0].songs;
    return {
      status: result.status,
      message: result.message,
    };
  };

  const addSongToCustomPlaylist = async (playlist_id, source_id) => {
    let result = await addSongToPlaylist(playlist_id, source_id);

    const idx = customPlaylists.value.findIndex(
      (item) => item.playlist_id === playlist_id,
    );

    if (idx !== -1) {
      customPlaylists.value[idx] = result.data[0];
    }

    return {
      status: result.status,
      message: result.message,
    };
  };

  const removeSongFromCustomPlaylist = async (playlist_id, source_id) => {
    let result = await removePlaylistSong(playlist_id, source_id);

    const idx = customPlaylists.value.findIndex(
      (item) => item.playlist_id === playlist_id,
    );

    if (idx !== -1) {
      customPlaylists.value[idx] = result.data[0];
    }
  };

  // --- 自訂清單 ---

  /** 建立新清單，回傳新清單物件 */
  const createPlaylist = async (name) => {
    const res = await MYAPI.post("/create_playlist", { name: name.trim() });
    if (res.status === "success") {
      customPlaylists.value.push(res.data);
      return res.data;
    }

    throw new Error(res.message);
  };

  /** 刪除清單 */
  const deletePlaylist = async (playlistId) => {
    await MYAPI.post("/delete_playlist", { playlist_id: playlistId });
    const idx = customPlaylists.value.findIndex(
      (p) => p.playlist_id === playlistId,
    );
    if (idx !== -1) customPlaylists.value.splice(idx, 1);
  };

  /** 改名清單 */
  const renamePlaylist = async (playlistId, newName) => {
    await MYAPI.post(`/rename_playlist`, {
      playlist_id: playlistId,
      newName: newName.trim(),
    });
    const pl = customPlaylists.value.find((p) => p.playlist_id === playlistId);
    if (pl) pl.name = newName.trim();
  };

  /** 查詢歌曲是否在某清單（同步） */
  const isInPlaylist = (playlistId, sourceId) => {
    const pl = customPlaylists.value.find((p) => p.playlist_id === playlistId);
    return pl ? pl.songs.some((v) => v.source_id === sourceId) : false;
  };

  return {
    favorites,
    customPlaylists,
    isFetching,
    isInitialized,
    fetchPlaylists,
    isFavorite,
    toggleFavorite,
    addFavorite,
    addSongToCustomPlaylist,
    removeSongFromCustomPlaylist,
    removeFavorite,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    isInPlaylist,
  };
  // 不使用 persist：資料由後端管理，無需 localStorage 快取
});
