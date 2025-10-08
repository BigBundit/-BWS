import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { CogIcon } from './icons';

interface GoogleCalendarPanelProps {
    currentUser: string;
}

const GoogleCalendarPanel: React.FC<GoogleCalendarPanelProps> = ({ currentUser }) => {
    const [calendarUrl, setCalendarUrl] = useLocalStorage<string | null>(`bws-gcal-url-${currentUser}`, null);
    const [isEditing, setIsEditing] = useState<boolean>(!calendarUrl);
    const [tempUrl, setTempUrl] = useState(calendarUrl || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation for an embed URL
        if (tempUrl && tempUrl.startsWith('https://calendar.google.com/calendar/embed?')) {
            setCalendarUrl(tempUrl);
            setIsEditing(false);
        } else {
            alert('Please enter a valid Google Calendar embed URL.');
        }
    };

    if (isEditing || !calendarUrl) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-6 p-4 text-center animate-fade-in-fast">
                <h3 className="text-2xl font-bold text-cyan-300">Embed Google Calendar</h3>
                <form onSubmit={handleSave} className="w-full max-w-sm flex flex-col gap-4">
                    <div>
                         <label htmlFor="gcal-url" className="block text-fuchsia-300 mb-2 text-left">
                            Google Calendar Embed URL
                        </label>
                        <input
                            id="gcal-url"
                            type="url"
                            value={tempUrl}
                            onChange={(e) => setTempUrl(e.target.value)}
                            placeholder="https://calendar.google.com/calendar/embed?..."
                            required
                            className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        {calendarUrl && (
                           <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-500 rounded-md transition-all text-gray-300">Cancel</button>
                        )}
                        <button type="submit" className="px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white">
                            Save
                        </button>
                    </div>
                </form>
                <div className="text-xs text-left text-gray-400 max-w-sm border-t border-fuchsia-800/50 pt-4 mt-2">
                    <p className="font-bold mb-1">How to get the URL:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Open Google Calendar on your desktop.</li>
                        <li>Find your calendar under "My calendars", click the three dots, and choose "Settings and sharing".</li>
                        <li>Under "Access permissions for events", make sure "Make available to public" is checked.</li>
                        <li>Scroll down to "Integrate calendar" and copy the URL from the "Embed code" box (just the URL part inside `src="..."`).</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            <button
                onClick={() => setIsEditing(true)}
                className="absolute top-1 right-1 z-10 p-2 bg-gray-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-full transition-all text-cyan-300 hover:text-white"
                title="Change Calendar URL"
            >
                <CogIcon className="w-5 h-5" />
            </button>
            <iframe
                src={calendarUrl}
                className="w-full h-full border-0 rounded-md"
                width="800"
                height="600"
                frameBorder="0"
                scrolling="no"
            ></iframe>
        </div>
    );
};

export default GoogleCalendarPanel;
