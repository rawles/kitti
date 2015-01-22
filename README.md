Kitti is a system for keeping track of who paid for what and ensuring everything is fair (over time). No money changes hands between participants until they want to stop using Kitti.

The [current dashboard][] is automatically generated from the [transaction log][] and [letter/name mapping][]

Edit…
-----

Maybe in the future we’ll allow people to add transactions via SMS, Twitter, etc. In the meantime, you must be logged into GitHub and be listed as a contributor to the repository in order to [edit the transaction log][] or to [edit the letter/name mapping][].

Examples:
---------

transaction             | meaning
------------------------|---------------------------------------------------------------------------------------------------
A,B,C:20C dinner        | Amy, Ben and Cecilia had dinner that cost 20ukp. Cecilia paid 20ukp.
C(50%),B:90A shoes      | Cecilia and Ben got shoes. Cecilia's shoes were half the price of Ben's. Amy paid 90ukp.
B,A(4.60):10A tickets   | Ben and Amy got tickets. Amy's ticket was 4.60ukp. Amy paid 10ukp.
C,B:22.50B,18.00C dinner| Cecilia and Ben had dinner. Ben paid 22.50ukp. Cecilia paid 18ukp.

We put the date in front to keep track of things. See the [transaction log][] and [letter/name mapping][] for more examples.

Fork…
-----

If you want to use Kitti for shared expenses but don't want to be part of our network then just [fork][] the project and delete the entries to start afresh. You will need to also update the links in this README document.

Who is Kitti?
-------------

We asked a child. They produced this:

![kitti drawing](https://raw.githubusercontent.com/rawles/kitti/gh-pages/kitti.jpg)

They told us that Kitti has a very long nose. A waggy tail. Bulging eyes to see in the dark. A bump on their head. And a big tummy.

  [current dashboard]: http://rawles.github.io/kitti/
  [transaction log]: https://raw.githubusercontent.com/rawles/kitti/gh-pages/kittilog.txt
  [letter/name mapping]: https://raw.githubusercontent.com/rawles/kitti/gh-pages/names.txt
  [edit the transaction log]: https://github.com/rawles/kitti/edit/gh-pages/kittilog.txt
  [edit the letter/name mapping]: https://github.com/rawles/kitti/edit/gh-pages/names.txt
  [fork]: https://github.com/rawles/kitti/fork

