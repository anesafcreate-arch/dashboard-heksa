import { createContext, useContext, useReducer, useCallback } from 'react';
import {
  INITIAL_BARANG_MASUK,
  INITIAL_BARANG_KELUAR,
  DATABASE_KALIBRASI,
  INITIAL_JADWAL_ONSITE,
} from '../data/mockData';

const DataContext = createContext(null);

const initialState = {
  barangMasuk: INITIAL_BARANG_MASUK,
  barangKeluar: INITIAL_BARANG_KELUAR,
  databaseKalibrasi: DATABASE_KALIBRASI,
  jadwalOnsite: INITIAL_JADWAL_ONSITE,
  nextId: 13,
  nextDbId: 11,
  nextOnsiteId: 4,
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'ADD_BARANG_MASUK': {
      const newItem = { ...action.payload, id: state.nextId };
      const newBarangKeluar = {
        ...newItem,
        statusKalibrasi: 'MENUNGGU',
        sudahDiambil: false,
        tanggalDiambil: null,
      };
      // Map barangMasuk fields to databaseKalibrasi fields
      const newDb = {
        id: state.nextDbId,
        kodeAlat: action.payload.kodeBarang,
        namaAlat: action.payload.namaBarang,
        kategori: action.payload.jenisLayanan,
      };
      return {
        ...state,
        barangMasuk: [newItem, ...state.barangMasuk],
        barangKeluar: [newBarangKeluar, ...state.barangKeluar],
        databaseKalibrasi: [newDb, ...state.databaseKalibrasi],
        nextId: state.nextId + 1,
        nextDbId: state.nextDbId + 1,
      };
    }
    case 'EDIT_BARANG_MASUK': {
      const updated = action.payload;
      return {
        ...state,
        barangMasuk: state.barangMasuk.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item
        ),
        barangKeluar: state.barangKeluar.map((item) =>
          item.id === updated.id
            ? { ...item, kodeBarang: updated.kodeBarang, namaBarang: updated.namaBarang, jenisLayanan: updated.jenisLayanan }
            : item
        ),
      };
    }
    case 'DELETE_BARANG_MASUK':
      return {
        ...state,
        barangMasuk: state.barangMasuk.filter((item) => item.id !== action.payload),
        barangKeluar: state.barangKeluar.filter((item) => item.id !== action.payload),
      };
    case 'TOGGLE_DIAMBIL': {
      const id = action.payload;
      return {
        ...state,
        barangKeluar: state.barangKeluar.map((item) =>
          item.id === id
            ? {
                ...item,
                sudahDiambil: !item.sudahDiambil,
                statusKalibrasi: !item.sudahDiambil ? 'DIAMBIL' : 'SELESAI',
                tanggalDiambil: !item.sudahDiambil
                  ? new Date().toISOString().split('T')[0]
                  : null,
              }
            : item
        ),
      };
    }
    // Milestone Status Update
    case 'UPDATE_STATUS': {
      const { id, status } = action.payload;
      return {
        ...state,
        barangKeluar: state.barangKeluar.map((item) =>
          item.id === id
            ? {
                ...item,
                statusKalibrasi: status,
                sudahDiambil: status === 'DIAMBIL',
                tanggalDiambil: status === 'DIAMBIL'
                  ? new Date().toISOString().split('T')[0]
                  : item.tanggalDiambil,
              }
            : item
        ),
      };
    }
    case 'ADD_DATABASE': {
      const newDb = { ...action.payload, id: state.nextDbId };
      return {
        ...state,
        databaseKalibrasi: [newDb, ...state.databaseKalibrasi],
        nextDbId: state.nextDbId + 1,
      };
    }
    case 'EDIT_DATABASE':
      return {
        ...state,
        databaseKalibrasi: state.databaseKalibrasi.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    case 'DELETE_DATABASE':
      return {
        ...state,
        databaseKalibrasi: state.databaseKalibrasi.filter(
          (item) => item.id !== action.payload
        ),
      };
    case 'ADD_JADWAL_ONSITE': {
      const newJadwal = { ...action.payload, id: state.nextOnsiteId };
      return {
        ...state,
        jadwalOnsite: [newJadwal, ...state.jadwalOnsite],
        nextOnsiteId: state.nextOnsiteId + 1,
      };
    }
    case 'EDIT_JADWAL_ONSITE':
      return {
        ...state,
        jadwalOnsite: state.jadwalOnsite.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    case 'DELETE_JADWAL_ONSITE':
      return {
        ...state,
        jadwalOnsite: state.jadwalOnsite.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const addBarangMasuk = useCallback((item) => {
    dispatch({ type: 'ADD_BARANG_MASUK', payload: item });
  }, []);

  const editBarangMasuk = useCallback((item) => {
    dispatch({ type: 'EDIT_BARANG_MASUK', payload: item });
  }, []);

  const deleteBarangMasuk = useCallback((id) => {
    dispatch({ type: 'DELETE_BARANG_MASUK', payload: id });
  }, []);

  const toggleDiambil = useCallback((id) => {
    dispatch({ type: 'TOGGLE_DIAMBIL', payload: id });
  }, []);

  const updateStatus = useCallback((id, status) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } });
  }, []);

  const addDatabase = useCallback((item) => {
    dispatch({ type: 'ADD_DATABASE', payload: item });
  }, []);

  const editDatabase = useCallback((item) => {
    dispatch({ type: 'EDIT_DATABASE', payload: item });
  }, []);

  const deleteDatabase = useCallback((id) => {
    dispatch({ type: 'DELETE_DATABASE', payload: id });
  }, []);

  const addJadwalOnsite = useCallback((item) => {
    dispatch({ type: 'ADD_JADWAL_ONSITE', payload: item });
  }, []);

  const editJadwalOnsite = useCallback((item) => {
    dispatch({ type: 'EDIT_JADWAL_ONSITE', payload: item });
  }, []);

  const deleteJadwalOnsite = useCallback((id) => {
    dispatch({ type: 'DELETE_JADWAL_ONSITE', payload: id });
  }, []);

  return (
    <DataContext.Provider
      value={{
        ...state,
        addBarangMasuk,
        editBarangMasuk,
        deleteBarangMasuk,
        toggleDiambil,
        updateStatus,
        addDatabase,
        editDatabase,
        deleteDatabase,
        addJadwalOnsite,
        editJadwalOnsite,
        deleteJadwalOnsite,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

export default DataContext;
