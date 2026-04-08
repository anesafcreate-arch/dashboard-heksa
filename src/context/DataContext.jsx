import { createContext, useContext, useReducer, useCallback } from 'react';
import {
  INITIAL_ALAT_MASUK,
  INITIAL_ALAT_KELUAR,
  DATABASE_KALIBRASI,
} from '../data/mockData';

const DataContext = createContext(null);

// 1. Initial State - Pakai nama 'alat' biar sinkron semua
const initialState = {
  alatMasuk: INITIAL_ALAT_MASUK,
  alatKeluar: INITIAL_ALAT_KELUAR,
  databaseKalibrasi: DATABASE_KALIBRASI,
  nextId: 100, // Mulai dari ID tinggi agar tidak bentrok
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'ADD_ALAT_MASUK': {
      const newItem = { ...action.payload, id: state.nextId };
      
      // Tambahkan juga ke daftar alat keluar dengan status awal
      const newAlatKeluar = {
        ...newItem,
        statusKalibrasi: 'MENUNGGU',
        sudahDiambil: false,
        tanggalDiambil: null,
      };

      return {
        ...state,
        alatMasuk: [newItem, ...state.alatMasuk],
        alatKeluar: [newAlatKeluar, ...state.alatKeluar],
        nextId: state.nextId + 1,
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

    // Case untuk Database Kalibrasi
    case 'ADD_DATABASE':
      return {
        ...state,
        databaseKalibrasi: [{ ...action.payload, id: Date.now() }, ...state.databaseKalibrasi],
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

  const updateStatus = useCallback((id, status) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } });
  }, []);

  const deleteAlatMasuk = useCallback((id) => {
    dispatch({ type: 'DELETE_ALAT_MASUK', payload: id });
  }, []);

  const addDatabase = useCallback((item) => {
    dispatch({ type: 'ADD_DATABASE', payload: item });
  }, []);

  return (
    <DataContext.Provider
      value={{
        ...state,
        addAlatMasuk,
        updateStatus,
        deleteAlatMasuk,
        addDatabase,
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