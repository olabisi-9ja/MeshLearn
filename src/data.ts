import { MeshFile, PeerNode, ActiveTransfer } from './types';

export const INITIAL_FILES: MeshFile[] = [
  {
    id: 'f1',
    name: 'Calculus 101 Study Guide.pdf',
    type: 'PDF',
    size: '12.4 MB',
    peers: 42,
    status: 'offline',
    category: 'document',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB82zp214kOxvJ1D_llnNCuh-vwGBmV5kR2PvtKZk_fa0mioGWjY_y0MIYTEVvJd1X_W8hSNVgpcyNkvFJEySh3fP2X6nUP58lOvxjSOgYfD_7JmRR2kAB1Tgux0FKUkUI4P7Z_khKeLzowypi9x3x6f1OYTYi-RjB1z49FwfLgLAvt2FAJ976qburfFXnmB9nM1yQqNGY0JF-4F3h0SiotO-J-L7mF7oiPT_zDurmrZSRdwmj9H7pEiQqnyOoViylq2Pfxcv6on-1y',
    description: 'A comprehensive summary of limits, derivatives, and practice problems for the upcoming midterm exam.',
    downloadCount: 142
  },
  {
    id: 'f2',
    name: 'Intro to Psychology Lecture.mp4',
    type: 'VIDEO',
    size: '45.1 MB',
    peers: 28,
    status: 'offline',
    category: 'video',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlj26CI2VuGNvp0mqK5QnrnFro-W89hlx_YHpYLZ6tfX4xp3EEdG-sb7iFBrf48WQ3Nedau-D6oI_YXZ0p94kumg32dV6aT8oBZ-iOlI-vWV6I715oNR4DCT2_BlNm9AArvel-u6R5CiKAJ1xBK3XJfRvw8UzJrkV0oRuEEgS4TmEfWPUYPFePZA3cMc2RVso-xs2kARIBY8ZfcR7j63p1wpN6pjK9ciC4zYcLKwEzj1J9IaZHN6DRaVsj1HXQOzdtxpsTm-4QEAMl',
    description: 'Video recording explaining cognitive development theories, memory retention hacks, and classical conditioning.',
    downloadCount: 98
  },
  {
    id: 'f3',
    name: 'World History Flashcards.zip',
    type: 'ZIP',
    size: '1.4 GB',
    peers: 8,
    status: 'remote',
    category: 'raw_data',
    description: 'A packed folder containing high-quality exam study cards, interactive timelines, and maps from ancient history to the 20th century.'
  },
  {
    id: 'f4',
    name: 'English Essay Structural Guide.txt',
    type: 'TXT',
    size: '242 KB',
    peers: 3,
    status: 'remote',
    category: 'document',
    description: 'Quick reference notes showing how to structure arguments, draft a strong thesis statement, and properly cite your research sources.'
  },
  {
    id: 'f5',
    name: 'Organic Chemistry Reactions.pdf',
    type: 'PDF',
    size: '12 MB',
    peers: 4,
    status: 'remote',
    category: 'document',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB82zp214kOxvJ1D_llnNCuh-vwGBmV5kR2PvtKZk_fa0mioGWjY_y0MIYTEVvJd1X_W8hSNVgpcyNkvFJEySh3fP2X6nUP58lOvxjSOgYfD_7JmRR2kAB1Tgux0FKUkUI4P7Z_khKeLzowypi9x3x6f1OYTYi-RjB1z49FwfLgLAvt2FAJ976qburfFXnmB9nM1yQqNGY0JF-4F3h0SiotO-J-L7mF7oiPT_zDurmrZSRdwmj9H7pEiQqnyOoViylq2Pfxcv6on-1y',
    description: 'Visual flowcharts showing chemical structures, reaction pathways, and simple shortcuts to memorize complex equations.'
  },
  {
    id: 'f6',
    name: 'College Physics Problem Walkthroughs.mp4',
    type: 'VIDEO',
    size: '84 MB',
    peers: 12,
    status: 'remote',
    category: 'video',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlj26CI2VuGNvp0mqK5QnrnFro-W89hlx_YHpYLZ6tfX4xp3EEdG-sb7iFBrf48WQ3Nedau-D6oI_YXZ0p94kumg32dV6aT8oBZ-iOlI-vWV6I715oNR4DCT2_BlNm9AArvel-u6R5CiKAJ1xBK3XJfRvw8UzJrkV0oRuEEgS4TmEfWPUYPFePZA3cMc2RVso-xs2kARIBY8ZfcR7j63p1wpN6pjK9ciC4zYcLKwEzj1J9IaZHN6DRaVsj1HXQOzdtxpsTm-4QEAMl',
    description: 'Video explaining step-by-step solutions for challenging mechanics, thermodynamic laws, and wave motion equations.'
  },
  {
    id: 'f7',
    name: 'Intro to Economics Core Concepts.txt',
    type: 'TXT',
    size: '15 KB',
    peers: 45,
    status: 'remote',
    category: 'document',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEGd_oDY6RqOFO86AE8vjvXOTy-fcCsq8l5xXOnS4i8m6U1UHWJiJE6nKHU45hcH1qqwrKntY8ZZwOGgCPrOCQdfp18oA7YfvuXswp4u4pIr6mhCFGd8eTQIuLfWLiPAo7f1EHWNi-HWtbPiFyFJffT3ZjEbNuoDiFYiQEAM1U2f2FS3RAUgmc1HHkq5XGxU8jv7yGoYh4DUhRogtw29cq4RD2rWY8dzcfiQQhQ2nnItzNCQ1YUGqzHkYpCagLM1HKVMKZGZy21Y93',
    description: 'Summary tables comparing supply/demand curves, market dynamics, and basic microeconomics principles.'
  },
  {
    id: 'f8',
    name: 'Spanish Vocabulary Pronunciation.zip',
    type: 'ZIP',
    size: '4.2 MB',
    peers: 7,
    status: 'remote',
    category: 'raw_data',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf28LxWNiMYT9jiUGrsGm_x-l1f_fBNkuupPbIr-cwx-gy4xR40F0I79ozLvR4vF2-dOWnlKRuDEWDIU2-PE2RrrQn-qUXNPorhudiT-MXwGGlPP37Mze1OUItgO-d7iOI1Pfa-f2LPk76jOpvXWZwAnkShbttMaK0SORYrX9v7lCeys6Ttc4MhZjG44JiTjUfj9sXWEXNwjsrBqSSPdtT1NM5NL-yajSGSmaSsgJGpk7I-7cXH3N9-UWkXj56ckP_g2muzbMRlych',
    description: 'Recorded audio clips of native vocabulary pronunciations, daily conversational starters, and practice quizzes.'
  },
  {
    id: 'f9',
    name: 'Biology Lab Report Instructions.pdf',
    type: 'PDF',
    size: '12.4 MB',
    peers: 8,
    status: 'remote',
    category: 'document',
    description: 'Standard guidelines on how to structure science lab reports, draft hypotheses, and accurately draw cell structures.'
  },
  {
    id: 'f10',
    name: 'Art History Masterpieces Lecture.mp4',
    type: 'VIDEO',
    size: '245 MB',
    peers: 3,
    status: 'remote',
    category: 'video',
    description: 'Video guide showcasing classical renaissance masterpieces, historical context, and modern art styles.'
  },
  {
    id: 'f11',
    name: 'Effective Time Management Tips.wav',
    type: 'AUDIO',
    size: '45 MB',
    peers: 12,
    status: 'remote',
    category: 'audio',
    description: 'Helpful student podcast with advice on dodging procrastination, active review strategies, and organizing study groups.'
  }
];

export const INITIAL_TRANSFERS: ActiveTransfer[] = [
  {
    id: 't1',
    fileId: 't-neural',
    name: 'History_Exam_Review_Sheet.zip',
    type: 'ZIP',
    direction: 'incoming',
    progress: 72,
    speed: '4.2 MB/s',
    eta: '4m 12s left',
    peerName: "Alexander's iPad",
    sizeLeft: '4.2 MB left'
  },
  {
    id: 't2',
    fileId: 't-sch-v4',
    name: 'Chemistry_Lab_Instructions.pdf',
    type: 'PDF',
    direction: 'incoming',
    progress: 41,
    speed: '9.8 MB/s',
    eta: '12m 09s left',
    peerName: "Sarah's iPhone",
    sizeLeft: '108 MB left'
  },
  {
    id: 't3',
    fileId: 't-fluid',
    name: 'Creative_Writing_Feedback.txt',
    type: 'TXT',
    direction: 'outgoing',
    progress: 94,
    speed: '11.4 MB/s',
    eta: 'Finalizing',
    peerName: 'Library Shared Hub',
    sizeLeft: 'Sharing with classmates...'
  }
];

export const INITIAL_PEERS: PeerNode[] = [
  {
    id: 'p-node-entry',
    name: "Alexander's iPad",
    status: 'active',
    signalStrength: 4,
    latencyMs: 12,
    isLocal: false,
    sharedFilesCount: 88
  },
  {
    id: 'p-local',
    name: 'My Device (You)',
    status: 'active',
    signalStrength: 4,
    latencyMs: 0,
    isLocal: true,
    sharedFilesCount: 12
  },
  {
    id: 'p-alpha',
    name: 'Library Shared Hub',
    status: 'inactive',
    signalStrength: 2,
    latencyMs: 184,
    isLocal: false,
    sharedFilesCount: 41
  },
  {
    id: 'p-beta',
    name: "Liam's MacBook",
    status: 'inactive',
    signalStrength: 1,
    latencyMs: 320,
    isLocal: false,
    sharedFilesCount: 19
  },
  {
    id: 'p-relay-1',
    name: 'Study Room Router',
    status: 'relay',
    signalStrength: 3,
    latencyMs: 45,
    isLocal: false,
    sharedFilesCount: 154
  },
  {
    id: 'p-112',
    name: "Sarah's iPhone",
    status: 'active',
    signalStrength: 3,
    latencyMs: 34,
    isLocal: false,
    sharedFilesCount: 22
  }
];
