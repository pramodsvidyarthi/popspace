import { CAMERA_TRACK_NAME } from '@constants/User';
import { useNamedPublication } from '@providers/twilio/hooks/useNamedPublication';
import useTrack from '@providers/twilio/hooks/useTrack';
import { render } from '@testing-library/react';
import React from 'react';
import { LocalTrackPublication, RemoteTrackPublication } from 'twilio-video';

import LocalVideoPreview from './LocalVideoPreview';

jest.mock('@providers/twilio/hooks/useNamedPublication');
jest.mock('@providers/twilio/hooks/useTrack');
jest.mock('@providers/twilio/hooks/useLocalParticipant');
jest.mock('@hooks/useSpatialAudioVolume/useSpatialAudioVolume');

const mockUseNamedTrack = useNamedPublication as jest.Mock<LocalTrackPublication | RemoteTrackPublication | null>;
const mockUseTrack = useTrack as jest.Mock<any>;

describe('the LocalVideoPreview component', () => {
  it('it should render a VideoTrack component when there is a "camera" track', () => {
    mockUseNamedTrack.mockReturnValue({ trackName: `${CAMERA_TRACK_NAME}#foo` } as LocalTrackPublication);
    mockUseTrack.mockReturnValue({
      name: 'camera',
      kind: 'video',
      attach: jest.fn(),
      detach: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    });
    const { container } = render(<LocalVideoPreview />);
    expect(container.querySelector('video')).not.toBe(null);
  });

  it('should render null when there are no "camera" tracks', () => {
    mockUseNamedTrack.mockReturnValue(null);
    const { container } = render(<LocalVideoPreview />);
    expect(container.querySelector('video')).toEqual(null);
  });
});
