import { useState } from 'react';
import { MdAdd, MdCheck, MdClose, MdDeleteOutline, MdEdit } from 'react-icons/md';

import variables from 'config/variables';
import EventBus from 'utils/eventbus';
import { Row, Content, Action } from 'components/Layout/Settings/Item';

import {
  addChannel,
  isBuiltInList,
  isStreamUrl,
  makeChannel,
  readChannels,
  removeChannel,
  restoreChannels,
  updateChannel,
} from '../../api/live';

import './liveChannels.scss';

const SECTION = 'modals.main.settings.sections.background.live';
const text = (key) => variables.getMessage(`${SECTION}.${key}`);

/**
 * The channels this source can play, as a list the profile owns. The built-in channels
 * are only the starting point: each one can be renamed, pointed elsewhere or removed,
 * because a stream that moves should not need a new build to follow it.
 */
const LiveChannels = ({ onChanged }) => {
  const [channels, setChannels] = useState(readChannels);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', url: '' });
  const [error, setError] = useState('');

  const announce = () => {
    onChanged?.();
    EventBus.emit('refresh', 'backgroundrefresh');
  };

  const commit = (next) => {
    setChannels(next);
    setEditing(null);
    setAdding(false);
    setDraft({ name: '', url: '' });
    setError('');
    announce();
  };

  const check = (candidate, editingId) => {
    const name = candidate.name.trim();
    const url = candidate.url.trim();

    if (!name) return text('name_error');
    if (!isStreamUrl(url)) return text('url_error');

    // The same address twice would play one stream under two names.
    const taken = channels.some(
      (channel) => channel.id !== editingId && channel.url.trim().toLowerCase() === url.toLowerCase(),
    );

    return taken ? text('url_duplicate') : '';
  };

  const startEdit = (channel) => {
    setAdding(false);
    setError('');
    setEditing(channel.id);
    setDraft({ name: channel.name, url: channel.url });
  };

  const startAdd = () => {
    setEditing(null);
    setError('');
    setAdding(true);
    setDraft({ name: '', url: '' });
  };

  const cancel = () => {
    setEditing(null);
    setAdding(false);
    setDraft({ name: '', url: '' });
    setError('');
  };

  const save = () => {
    const problem = check(draft, editing);

    if (problem) {
      setError(problem);

      return;
    }

    commit(editing ? updateChannel(editing, draft) : addChannel(makeChannel(draft)));
  };

  const remove = (id) => commit(removeChannel(id));

  const restore = () => commit(restoreChannels());

  const fields = (
    <>
      <input
        className="liveChannelInput liveChannelInput-name"
        value={draft.name}
        placeholder={text('name_placeholder')}
        aria-label={text('name')}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
      />
      <input
        className="liveChannelInput liveChannelInput-url"
        value={draft.url}
        placeholder={text('url_placeholder')}
        aria-label={text('url')}
        onChange={(event) => setDraft({ ...draft, url: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save();
          if (event.key === 'Escape') cancel();
        }}
      />
    </>
  );

  const controls = (
    <span className="liveChannelControls">
      <button className="liveChannelIcon" type="button" aria-label={text('save')} onClick={save}>
        <MdCheck />
      </button>
      <button className="liveChannelIcon" type="button" aria-label={text('cancel')} onClick={cancel}>
        <MdClose />
      </button>
    </span>
  );

  return (
    <>
      <Row>
        <Content title={text('channels_title')} subtitle={text('channels_subtitle')} />
        <Action>
          <button
            className="liveChannelButton"
            type="button"
            onClick={adding ? cancel : startAdd}
            aria-pressed={adding}
          >
            <MdAdd />
            {text('add')}
          </button>
        </Action>
      </Row>

      <div className="liveChannelList">
        {channels.length === 0 && !adding ? (
          <span className="liveChannelEmpty">{text('empty')}</span>
        ) : null}

        {channels.map((channel) =>
          editing === channel.id ? (
            <div className="liveChannelRow liveChannelRow-editing" key={channel.id}>
              {fields}
              {controls}
            </div>
          ) : (
            <div className="liveChannelRow" key={channel.id}>
              <span className="liveChannelName">{channel.name}</span>
              <span className="liveChannelUrl" title={channel.url}>
                {channel.url}
              </span>
              <span className="liveChannelControls">
                <button
                  className="liveChannelIcon"
                  type="button"
                  aria-label={`${text('edit')} ${channel.name}`}
                  onClick={() => startEdit(channel)}
                >
                  <MdEdit />
                </button>
                <button
                  className="liveChannelIcon liveChannelIcon-delete"
                  type="button"
                  aria-label={`${text('delete')} ${channel.name}`}
                  onClick={() => remove(channel.id)}
                >
                  <MdDeleteOutline />
                </button>
              </span>
            </div>
          ),
        )}

        {adding ? (
          <div className="liveChannelRow liveChannelRow-editing">
            {fields}
            {controls}
          </div>
        ) : null}
      </div>

      {error ? <span className="liveChannelError">{error}</span> : null}

      {!isBuiltInList(channels) ? (
        <button className="liveChannelRestore" type="button" onClick={restore}>
          {text('restore')}
        </button>
      ) : null}
    </>
  );
};

export { LiveChannels };

export default LiveChannels;
