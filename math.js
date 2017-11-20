function matrix_zeros( N ) {
    // initialize an NxN matrix of zeros
    var out = [];
    for( var i = 0; i < N; ++i ) {
        out[i] = [];
        for( var j = 0; j < N; ++j ) {
            out[i][j] = 0.0;
        }
    }
    return out;
}

function matrix_times( a, b ) {
    // multiply two matrices together
    Ra = a.length;
    Ca = a[0].length;
    Rb = b.length; // assume Ca==Rb
    Cb = b[0].length;
    var out = [];
    for( var r = 0; r < Ra; ++r ) {
        out[r] = [];
        for( var c = 0; c < Cb; ++c ) {
            out[r][c] = 0.0;
            for( var i = 0; i < Ca; ++i ) {
                out[r][c] += a[r][i] * b[i][c];
            }
        }
    }
    return out;
}

function matrix_add( a, b ) {
    // a+b
    R = a.length;
    C = a[0].length; // assume rectangular and same size
    var out = [];
    for( var r = 0; r < R; ++r ) {
        out[r] = [];
        for( var c = 0; c < C; ++c ) {
            out[r][c] = a[r][c] + b[r][c];
        }
    }
    return out;
}

function matrix_times_scalar( a, b ) {
    // multiply matrix a by scalar b
    R = a.length;
    C = a[0].length; // assume rectangular
    var out = [];
    for( var r = 0; r < R; ++r ) {
        out[r] = [];
        for( var c = 0; c < C; ++c ) {
            out[r][c] = a[r][c] * b;
        }
    }
    return out;
}

function matrix_sum( a ) {
    // columnwise sum of matrix
    R = a.length;
    C = a[0].length; // assume rectangular
    var out = [];
    for( var c = 0; c < C; ++c ) {
        out[c] = 0.0;
        for( var r = 0; r < R; ++r ) {
            out[c] += a[r][c];
        }
    }
    return out;
}

function matrix_diag( a ) {
    // turn vector into a diagonal matrix
    N = a.length;
    var out = matrix_zeros( N );
    for( var i = 0; i < N; ++i ) {
        out[i][i] = a[i];
    }
    return out;
}

function matrix_transpose( a ) {
    // transpose matrix
    R = a.length;
    C = a[0].length; // assume rectangular
    var out = [];
    for( var c = 0; c < C; ++c ) {
        out[c] = [];
        for( var r = 0; r < R; ++r ) {
            out[c][r] = a[r][c];
        }
    }
    return out;
}
