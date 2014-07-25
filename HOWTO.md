HOWTO
-----

Each participant joins by choosing a single letter to represent them. This is usually their initial but needn’t be. The letter is always associated with them. The Tongs do not have enough friends for this to be a problem. The letters `D` and `E` are reserved, the reasons for which we’ll explain later.

When it comes to be the time to pay for something, Kitti is consulted by visiting <http://kitti.tongs.org.uk/> on a smartphone. The person with the lowest credit (i.e., listed first) who is also at the meal, event or whatever, usually pays for it. Kitti lists participants in the order they should pay, so the first person on the list who is also there usually pays up. Tongs always split the bill equally. If they can’t pay — Tongs usually forget to bring money to things — someone else can.

After they’ve paid, a transaction is added to the transaction log to describe who was there, how much the bill was, and who paid for it. This actually means that a line is added in a file called `kittilog.txt`. The form of the line is illustrated in this example line:

    2014-07-23T20:30 PMB60M Noodles

Tokens are separated by whitespace. The first token is the date and time of the transaction. It should be in [ISO 8601][] format, but in practice, anything which is accepted by [Date::Parse][] will work. The second token has three parts. The first part is a sequence of letters naming who was present. The second is an amount, possibly fractional, and by default in pounds sterling. The third is the person who paid. The rest of the line is a comment, usually serving as a reminder of what was paid for. Symbols other than those in the class `[0-9A-Za-z£€$.]` are ignored, so the following is equivalent to the last transaction:

    2014-07-23T20:30 [P,M,B]:60-->[M!] Noodles

If the number is prefixed or suffixed by the symbol `€` or `E`, the amount is converted from euros. `$` or `D`, the amount is converted from US dollars. If both a prefix and suffix appear, the prefix is used. If both symbols appear in a prefix or suffix, the first is used.

This line means that people represented by `P`, `M` and `B` went out and £60 was paid by the person represented by `M`. This code is usually send to the maintainer of Kitti via text message (without the date, since the phone network will timestamp the message), but other methods of transmission (e.g. Twitter) work too, as long as the maintainer updates the log.

Sometimes more than one person pays. The transaction description can be extended like this:

    PMB40M20P
    
This means that `M` paid £40 and `P` paid £20.

A small program adjusts credits for each participant after the transaction log is updated. Everyone can browse the transaction log on the site to see how the numbers were arrived at and what they’ve paid for. The transaction log file `kittilog.txt` is also available [on GitHub][] and anyone can edit it and add to it. Kitti will automatically pull the changes and update themself.

If someone wants to stop using Kitti, they can either buy their debt from, or sell their credit to, someone else. If `A` is leaving and their account is in debit, for example -£7, they can settle up by giving £7 to `B`. They tell Kitti this by adding the following to the log:

    B7A

Conversely, they can sell their credit to someone else and cash in their account. If `A`’s account is £8 and `B` buys their credit by giving them £8, they tell Kitti like this:

    A8B

Selling credit can be done among several people, like so:

    A5B3C

In each case, the person after the number paid, and the people before the number benefitted somehow. The general interpretation, then, of the transaction

    ABC100C

could be a command to Kitti: "Please transfer £100 in credit from those named before the amount (`A`, `B` and `C`), to the one named after it (`C`), in equal quantities." (In doing so, `C` transfers some money to themself, but don’t let that confuse you!)

  [ISO 8601]: https://en.wikipedia.org/wiki/ISO_8601
  [Date::Parse]: http://search.cpan.org/~gbarr/TimeDate-2.30/lib/Date/Parse.pm
  [on GitHub]: https://github.com/rawles/kitti
