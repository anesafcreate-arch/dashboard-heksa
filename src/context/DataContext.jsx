import { createContext, useContext, useReducer, useCallback } from 'react';
import {
  INITIAL_ALAT_MASUK,
  INITIAL_ALAT_KELUAR,
  DATABASE_KALIBRASI,
} from '../data/mockData';

const DataContext = createContext(null);

const getNextId = (arr, fallback = 1) => {
  const max = Array.isArray(arr) && arr.length ? Math.max(...arr.map((x) => Number(x?.id) || 0)) : 0;
  return Math.max(max + 1, fallback);
};

// 1. Initial State
const initialState = {
  alatMasuk: INITIAL_ALAT_MASUK,
  alatKeluar: INITIAL_ALAT_KELUAR,
  databaseKalibrasi: DATABASE_KALIBRASI,
  nextId: getNextId(INITIAL_ALAT_MASUK, 100), // Mulai tinggi agar tidak bentrok
  nextDbId: getNextId(DATABASE_KALIBRASI, 100),
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'ADD_ALAT_MASUK': {
      const newItem = { ...action.payload, id: state.nextId };
      const kodeAlat = newItem.kodeAlat || newItem.kodeBarang || '';
      const namaAlat = newItem.namaAlat || newItem.namaBarang || '';
      const jenisLayanan = newItem.jenisLayanan || newItem.kategori || '';
      
      // Tambahkan juga ke daftar alat keluar dengan status awal
      const newAlatKeluar = {
        ...newItem,
        kodeAlat,
        namaAlat,
        jenisLayanan,
        statusKalibrasi: 'MENUNGGU',
        sudahDiambil: false,
        tanggalDiambil: null,
      };

      return {
        ...state,
        alatMasuk: [newItem, ...state.alatMasuk],
        alatKeluar: [newAlatKeluar, ...state.alatKeluar],
        // Summary (database) otomatis dari input Alat Masuk
        databaseKalibrasi: [
          {
            id: state.nextDbId,
            kodeAlat,
            namaAlat,
            kategori: jenisLayanan,
          },
          ...state.databaseKalibrasi,
        ],
        nextId: state.nextId + 1,
        nextDbId: state.nextDbId + 1,
      };
    }

    case 'EDIT_ALAT_MASUK': {
      const updated = action.payload;
      return {
        ...state,
        alatMasuk: state.alatMasuk.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item
        ),
        alatKeluar: state.alatKeluar.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                kodeAlat: updated.kodeAlat,
                namaAlat: updated.namaAlat,
                jenisLayanan: updated.jenisLayanan,
              }
            : item
        ),
      };
    }

    case 'UPDATE_STATUS': {
      const { id, status } = action.payload;
      return {
        ...state,
        alatKeluar: state.alatKeluar.map((item) =>
          item.id === id
            ? {
                ...item,
                statusKalibrasi: status,
                sudahDiambil: status === 'DIAMBIL',
                tanggalDiambil: status === 'DIAMBIL' ? new Date().toISOString().split('T')[0] : item.tanggalDiambil,
              }
            : item
        ),
      };
    }

    case 'DELETE_ALAT_MASUK':
      return {
        ...state,
        alatMasuk: state.alatMasuk.filter((item) => item.id !== action.payload),
        alatKeluar: state.alatKeluar.filter((item) => item.id !== action.payload),
      };

    // Case untuk Database Kalibrasi (Summary)
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
        databaseKalibrasi: state.databaseKalibrasi.filter((item) => item.id !== action.payload),
      };

    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Bungkus fungsi dengan useCallback agar tidak bikin re-render terus
  const addAlatMasuk = useCallback((item) => {
    dispatch({ type: 'ADD_ALAT_MASUK', payload: item });
  }, []);

  const editAlatMasuk = useCallback((item) => {
    dispatch({ type: 'EDIT_ALAT_MASUK', payload: item });
  }, []);

  const updateStatus = useCallback((id, status) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } });
  }, []);

  const deleteAlatMasuk = useCallback((id) => {
    dispatch({ type: 'DELETE_ALAT_MASUK', payload: id });
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

  return (
    <DataContext.Provider
      value={{
        ...state,
        addAlatMasuk,
        editAlatMasuk,
        updateStatus,
        deleteAlatMasuk,
        addDatabase,
        editDatabase,
        deleteDatabase,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}

export default DataContext;