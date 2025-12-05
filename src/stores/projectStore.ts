import { create } from 'zustand';
import { Project } from '../types/project';
import { useTrackStore } from './trackStore';
import { useSequencerStore } from './sequencerStore';
import { useTransportStore } from './transportStore';

interface ProjectStoreAction {
    // Project Management
    loadProject: (project: Project) => void;
    saveProject: () => Project;
    createNewProject: (name: string) => void;

    // Metadata
    setProjectName: (name: string) => void;
}

// Helper to gather current state from all stores
const gatherProjectState = (): Project => {
    const trackState = useTrackStore.getState();
    const sequencerState = useSequencerStore.getState();
    const transportState = useTransportStore.getState();

    return {
        metadata: {
            id: `proj_${Date.now()}`,
            name: 'Untitled Project',
            created: Date.now(),
            lastModified: Date.now(),
            author: 'User'
        },
        state: {
            bpm: transportState.bpm,
            timeSignature: [4, 4], // Todo: add to transport store if needed
            tracks: trackState.tracks,
            activeTrackId: trackState.activeTrackId,
            sequencer: {
                patterns: sequencerState.patterns,
                stepCount: sequencerState.stepCount,
                stepResolution: sequencerState.stepResolution
            }
        },
        version: '1.0.0'
    };
};

export const useProjectStore = create<ProjectStoreAction>(() => ({
    loadProject: (project) => {
        console.log('Loading project...', project.metadata.name);

        // 1. Load Transport
        useTransportStore.getState().setBpm(project.state.bpm);

        // 2. Load Tracks
        useTrackStore.getState().setTracks(project.state.tracks);

        // 3. Load Sequencer
        const seqStore = useSequencerStore.getState();
        seqStore.setStepCount(project.state.sequencer.stepCount);
        seqStore.setStepResolution(project.state.sequencer.stepResolution);
        seqStore.setPatterns(project.state.sequencer.patterns);

        // 4. Update metadata if we had a store for it (not yet)
        // For now just log
        console.log(`Loaded project: ${project.metadata.name} (v${project.version})`);
    },

    saveProject: () => {
        return gatherProjectState();
    },

    createNewProject: (name) => {
        console.log('Creating new project:', name);
        // Reset stores to default
        // This requires implementing resetActions in each store or manually resetting here
        // For MVP, we can just reload the page or implement basic resets
        const seqStore = useSequencerStore.getState();
        seqStore.clearPattern();

        // Track store reset - simplistic approach for now
        // We would want properly defined "default project" state
        // But since the user didn't ask for "New Project" feature explicitly, mostly "Saving/Loading",
        // We will focus on save/load.
    },

    setProjectName: (name) => {
        console.log('Set project name:', name);
        // TODO: persist this
    }
}));
