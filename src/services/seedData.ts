import { UserProfile, Achievement, Hobby, MusicTrack, PrivateLink, PrivateNote, SecretAccountNote } from '../types';

export const INITIAL_PROFILE: UserProfile = {
  name: '',
  gamerTag: '',
  tagline: '',
  bio: '',
  avatarUrl: '',
  avatarFrame: 'cyber-hex',
  status: 'Online',
  currentPlaying: '',
  
  fullName: '',
  nickname: '',
  domicile: '',
  emailContact: '',
  aboutMe: '',
  
  additionalInfo: [],
  accentColor: 'cyan',
  
  sectionVisibility: {
    hero: true,
    identity: true,
    achievements: true,
    hobbies: true,
    music: true,
  }
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [];

export const INITIAL_HOBBIES: Hobby[] = [];

export const INITIAL_MUSIC: MusicTrack[] = [];

export const INITIAL_PRIVATE_LINKS: PrivateLink[] = [];

export const INITIAL_PRIVATE_NOTES: PrivateNote[] = [];

export const INITIAL_SECRET_ACCOUNTS: SecretAccountNote[] = [];

export const DEFAULT_VAULT_PASSWORD = '';
