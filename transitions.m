% Matlab code for the robot/swimming scenario:

% our edge probabilities as an adjacency matrix:
a = zeros( 4, 4 );
a(1,2)=0.3;
a(1,3)=0.3;
a(2,3)=0.3;
a(3,4)=0.1;
dt = 1.0;  % size of timestep
a = dt * a / sum( a(:) ); % normalize to sum to dt for small transaction steps
a = max( a, a' ); % (make symmetrical)

% fill in the diagonal with stay-here probabilities to make a transition matrix
tm = a + diag( 1 - sum( a ) ); % ( sum() is column-wise in matlab; diag() makes a vector into the diagonal of a matrix )

% show it
tm

%    0.4000    0.3000    0.3000         0
%    0.3000    0.4000    0.3000         0
%    0.3000    0.3000    0.3000    0.1000
%         0         0    0.1000    0.9000

% note that the sum of every row and column is 1, so it will never change the sum of credits+debits in the system

v0 = [ 5 5 -10 0 ]; % initial condition before swimming
vc = v0 + [ 0 0 5 -5 ]; % C pays
vd = v0 + [ 0 0 -5 5 ]; % D pays

np = 20 / dt;

% see what happens over time if C pays for swimming:
steps = 1:np;
v = vc;
unhealth1 = [];
for i = steps
    unhealth1( end+1 ) = sum( abs( v ) ) / 2; % half sum of all absolute values says how much credit is in the system
    v = v * tm;
end 

% see what happens over time if D pays for swimming:
v = vd;
unhealth2 = [];
for i = steps
    unhealth2( end+1 ) = sum( abs( v ) ) / 2;
    v = v * tm;
end 

% find the area under each curve
cost_C = 0;
cost_D = 0;
for i = 0:(100/dt)
    cost_C = cost_C + dt * sum( abs( vc * tm^i ) ) / 2;
    cost_D = cost_D + dt * sum( abs( vd * tm^i ) ) / 2;
end


% plot the two curves
figure;
hold on;
plot( dt*steps, unhealth1, 'b.-' );
plot( dt*steps, unhealth2, 'r.-' );
legend( sprintf( 'if C pays: %.2f', cost_C ), sprintf( 'if D pays: %.2f', cost_D ) );
ylabel( 'credit in the system (ukp)' );
xlabel( 'time' );
xlim( [ min(dt*steps), max(dt*steps) ] );
title( sprintf( 'robot club / swimming scenario starting from %s', mat2str( v0 ) ) );
disp('Press any key to continue');
pause;
