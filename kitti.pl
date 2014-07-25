#!/usr/bin/perl
use Date::Parse; use strict; use warnings;
use Data::Dumper;
my %names = (); open(N, "names.txt");
while (<N>) { $names{$1} = $2 while /^(.*):(.*)$/g } close(N);
my %weights = (); open(W, "weights.txt");
while (<W>) { $weights{$1} = $2 while /^(.*):(.*)$/g } close(W);

my $log = ""; my %bal = ();
open(KL, "kittilog.txt"); while (<KL>) { $log .= $_; } close(KL);
foreach my $line ( split("\n", $log) ) { 
	my $lt = parseline($line); if (!(defined $lt)) { next };
	my $total = 0; foreach my $to (@{$lt->{to}}) { $total += $to->{amount}; }
	my $wsum = weight(\%weights, $lt->{from});
	$bal{uc($1)} -= ($total*weight(\%weights, uc($1)))/$wsum while $lt->{from} =~ /([A-Za-z])/g;
	foreach my $to (@{$lt->{to}}) { $bal{uc($to->{to})} += $to->{amount} };  
	}

open(I, "/var/www/kitti.tongs.org.uk/html/index.html.t");
open(O, ">/var/www/kitti.tongs.org.uk/html/index.html");
my $table = "";
foreach my $user ( sort{$bal{$a}<=>$bal{$b}} keys %bal ) { 
	$table .= "<tr><td class=\"user\">".$names{$user}."</td>";
	$table .= "<td class=\"balance\">".money($bal{$user})."</td></tr>\n";
	}
my $date = scalar localtime time();
while(<I>) { s/%TABLE%/$table/g; s/%DATE%/$date/g; print O $_; };
close(I); close(O);
exit;

sub parseline { 
	my $line = shift;
	$line =~ s/^\s+//; $line =~ s/\s+$//; my @tokens = split(/\|/, $line); 
	my $time = str2time(shift @tokens); if (!( defined $time )) { return undef; } 
	my $txn = shift @tokens; $txn =~ s/[^0-9A-Za-z.]//g;
	if ( ! ( $txn =~ /^[A-Z]+([DE]?[0-9]+(\.[0-9]+)?[DE]?[A-Z])+$/ ) ) { return undef; } 
	my ( $from, $to ) = ( $txn =~ /^([A-Z]+)(([DE]?[0-9]+(\.[0-9]+)?[DE]?[A-Z])+)$/ );
	my @tos = (); push @tos,
		{'prefix' => $1, 'amount' => $2, 'suffix' => $4, 'to' => $5}
		while ( $to =~ /([DE]?)([0-9]+(\.[0-9]+)?)([DE]?)([A-Z])/g );
	#TODO - check all the tos are at the meal (in from)
	return {'time' => $time, 'from' => $from, 'to' => \@tos, 'desc' => join(" ", @tokens)};
	}
sub money { 
	if ( $_[0] >= 0 ) { return "&pound;".sprintf("%.2f", $_[0]); } 
		else { return "<span class=\"red\">&ndash;&pound;".sprintf("%.2f", -$_[0])."</span>"; } 
	}
sub weight {
	my %weights = %{$_[0]};
	my $t = 0; foreach my $c ( split(//, $_[1]) ) {
		if ( ! ( exists $weights{$c} ) ) { $t++; next; } 
		$t += $weights{uc($c)}; 
		}
	return $t;
	}
