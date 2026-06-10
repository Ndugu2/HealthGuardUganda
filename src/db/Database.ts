/**
 * Database — unified persistence via expo-sqlite (web, iOS, Android).
 */
export type {
  KnowledgeItem,
  ClaimRecord,
  Facility,
  Broadcast,
  PatientRecord,
  MaternalRecord,
  ChildRecord,
} from './types';

import * as store from './sqlite';

export const initDatabase = async (): Promise<void> => {
  await store.initSqlite();
};

export const saveEncounter = store.saveEncounter;
export const updateEncounterFeedback = store.updateEncounterFeedback;
export const getAllClaims = store.getAllClaims;
export const getStats = store.getStats;
export const searchKnowledge = store.searchKnowledge;
export const getAllKnowledge = async () => store.searchKnowledge('');
export const flagClaim = store.flagClaim;
export const saveKnowledge = store.saveKnowledge;
export const saveKnowledgeDelta = store.saveKnowledgeDelta;
export const loadLocalWeights = async () => {
  const raw = await store.loadLocalWeights();
  return raw ? JSON.parse(raw) : null;
};
export const saveLocalWeights = async (weights: unknown) => {
  await store.saveLocalWeights(JSON.stringify(weights));
};
export const saveSession = store.saveSession;
export const getSession = store.getSession;
export const clearSession = store.clearSession;
export const getResponseForKeyword = store.getResponseForKeyword;
export const getAllFacilities = store.getAllFacilities;
export const saveBroadcast = store.saveBroadcast;
export const getBroadcasts = store.getBroadcasts;
export const markBroadcastAsRead = store.markBroadcastAsRead;
export const saveSetting = store.saveSetting;
export const getSetting = store.getSetting;
export const getPatients = store.getPatients;
export const addPatient = store.addPatient;
export const updatePatientStatus = store.updatePatientStatus;
export const saveRegisteredUser = store.saveRegisteredUser;
export const getRegisteredUser = store.getRegisteredUser;
export const getAllRegisteredUsersFromDb = store.getAllRegisteredUsers;
export const updateRegisteredUserApproval = store.updateRegisteredUserApproval;

export const getMaternalRecords = store.getMaternalRecords;
export const saveMaternalRecord = store.saveMaternalRecord;
export const deleteMaternalRecord = store.deleteMaternalRecord;
export const getChildRecords = store.getChildRecords;
export const saveChildRecord = store.saveChildRecord;
export const deleteChildRecord = store.deleteChildRecord;

export const getCommunityShelf = store.getCommunityShelf;
export const addCommunityShelfItem = store.addCommunityShelfItem;
export const deductCommunityShelf = store.deductCommunityShelf;
export const addCommunityShelfStock = store.addCommunityShelfStock;
export const deleteCommunityShelfItem = store.deleteCommunityShelfItem;

