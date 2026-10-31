# Quick Links frequency ordering

Settings → Quick Links includes Order by Frequency of Use, off by default. Enable it to put the links opened most often over the last 30 days first. The option applies to icons, text and Metro tiles. Links with equal counts keep their saved manual order; disabling the option restores that order. The editor always shows the manual order so drag-and-drop remains predictable.

Tracking starts when the option is enabled. Normal clicks, keyboard activation, modified clicks and middle-clicks on the widget count as opens. Counts are stored in daily UTC buckets for the current day and the preceding 29 days, and expired entries stop contributing automatically. Standard and separate Focus/Work lists keep independent counts. Renaming a link or changing its icon retains its count; changing its destination resets its score. Deleted links and expired counts are removed during cleanup.

Counts stay in this browser profile and do not use browser history or a remote service. They are excluded from backups and cleared on profile reset or restore; the on/off preference is backed up. Failure to save a count does not prevent link navigation.

Regression tests cover the default, expiration boundary, stable ties, independent Focus counts, changed or deleted destinations, damaged storage and failed writes. Isolated browser checks cover the settings switch, all three views, keyboard and middle-click activation, switching layouts, and restoration of manual order.
