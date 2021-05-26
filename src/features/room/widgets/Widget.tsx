import * as React from 'react';
import { LinkWidget } from './link/LinkWidget';
import { StickyNoteWidget } from './stickyNote/StickyNoteWidget';
import { WhiteboardWidget } from './whiteboard/WhiteboardWidget';
import { YoutubeWidget } from './youtube/YoutubeWidget';
import { ScreenShareWidget } from './sidecarStream/SidecarStreamWidget';
import { WidgetType } from '../../../roomState/types/widgets';
import { MockUserWidget } from './mockUser/MockUserWidget';
import { logger } from '../../../utils/logger';
import { WidgetProvider } from './WidgetProvider';
import { useWidgetContext } from './useWidgetContext';
import { HuddleWidget } from './huddle/HuddleWidget';
export interface IWidgetProps {
  id: string;
}

/**
 * Pulls a Widget from the store by id and renders it as a draggable object
 * within a Room.
 */
export const Widget = React.memo<IWidgetProps>(({ id }) => {
  return (
    <WidgetProvider widgetId={id}>
      <WidgetContent />
    </WidgetProvider>
  );
});

/**
 * Renders any Widget content, deciding how to render based on the
 * Widget's `type`.
 */
const WidgetContent = React.memo(() => {
  const { widget } = useWidgetContext();

  switch (widget.type) {
    case WidgetType.Link:
      return <LinkWidget />;
    case WidgetType.StickyNote:
      return <StickyNoteWidget />;
    case WidgetType.Whiteboard:
      return <WhiteboardWidget />;
    case WidgetType.YouTube:
      return <YoutubeWidget />;
    case WidgetType.SidecarStream:
      return <ScreenShareWidget />;
    case WidgetType.MockUser:
      return <MockUserWidget />;
    case WidgetType.Huddle:
      return <HuddleWidget />;
    default:
      logger.debug(`Rendered unknown widget type: ${(widget as any).type}`);
      return null;
  }
});
